const { balance, constants, ether, expectEvent, send, expectRevert } = require('@openzeppelin/test-helpers');
const { ZERO_ADDRESS } = constants;

const { expect } = require('chai');

const PaymentSplitter = artifacts.require('PaymentSplitter');
const Token = artifacts.require('ERC20Mock');

contract('PaymentSplitter', function (accounts) {
  const [ owner, payee1, payee2, payee3, nonpayee1, payer1 ] = accounts;

  const amount = ether('1');

  it('rejects an empty set of payees', async function () {
    await expectRevert(PaymentSplitter.new([], []), 'PaymentSplitter: no payees');
  });

  it('rejects more payees than shares', async function () {
    await expectRevert(PaymentSplitter.new([payee1, payee2, payee3], [20, 30]),
      'PaymentSplitter: payees and shares length mismatch',
    );
  });

  it('rejects more shares than payees', async function () {
    await expectRevert(PaymentSplitter.new([payee1, payee2], [20, 30, 40]),
      'PaymentSplitter: payees and shares length mismatch',
    );
  });

  it('rejects null payees', async function () {
    await expectRevert(PaymentSplitter.new([payee1, ZERO_ADDRESS], [20, 30]),
      'PaymentSplitter: account is the zero address',
    );
  });

  it('rejects zero-valued shares', async function () {
    await expectRevert(PaymentSplitter.new([payee1, payee2], [20, 0]),
      'PaymentSplitter: shares are 0',
    );
  });

  it('rejects repeated payees', async function () {
    await expectRevert(PaymentSplitter.new([payee1, payee1], [20, 30]),
      'PaymentSplitter: account already has shares',
    );
  });

  context('once deployed', function () {
    beforeEach(async function () {
      this.payees = [payee1, payee2, payee3];
      this.shares = [20, 10, 70];

      this.contract = await PaymentSplitter.new(this.payees, this.shares);
      this.token = await Token.new('MyToken', 'MT', owner, ether('1000'));
    });

    it('has total shares', async function () {
      expect(await this.contract.totalShares()).to.be.bignumber.equal('100');
    });

    it('has payees', async function () {
      await Promise.all(this.payees.map(async (payee, index) => {
        expect(await this.contract.payee(index)).to.equal(payee);
        expect(await this.contract.released(payee)).to.be.bignumber.equal('0');
        expect(await this.contract.releasable(payee)).to.be.bignumber.equal('0');
      }));
    });

    describe('accepts payments', function () {
      it('Ether', async function () {
        await send.ether(owner, this.contract.address, amount);

        expect(await balance.current(this.contract.address)).to.be.bignumber.equal(amount);
      });

      it('Token', async function () {
        await this.token.transfer(this.contract.address, amount, { from: owner });

        expect(await this.token.balanceOf(this.contract.address)).to.be.bignumber.equal(amount);
      });
    });

    describe('shares', function () {
      it('stores shares if address is payee', async function () {
        expect(await this.contract.shares(payee1)).to.be.bignumber.not.equal('0');
      });

      it('does not store shares if address is not payee', async function () {
        expect(await this.contract.shares(nonpayee1)).to.be.bignumber.equal('0');
      });
    });

    describe('release', function () {
      describe('Ether', function () {
        it('reverts if no funds to claim', async function () {
          await expectRevert(this.contract.release(payee1),
            'PaymentSplitter: account is not due payment',
          );
        });
        it('reverts if non-payee want to claim', async function () {
          await send.ether(payer1, this.contract.address, amount);
          await expectRevert(this.contract.release(nonpayee1),
            'PaymentSplitter: account has no shares',
          );
        });
      });

      describe('Token', function () {
        it('reverts if no funds to claim', async function () {
          await expectRevert(this.contract.release(this.token.address, payee1),
            'PaymentSplitter: account is not due payment',
          );
        });
        it('reverts if non-payee want to claim', async function () {
          await this.token.transfer(this.contract.address, amount, { from: owner });
          await expectRevert(this.contract.release(this.token.address, nonpayee1),
            'PaymentSplitter: account has no shares',
          );
        });
      });
    });

    describe('tracks releasable and released', function () {
      it('Ether', async function () {
        await send.ether(payer1, this.contract.address, amount);
        const payment = amount.divn(10);
        expect(await this.contract.releasable(payee2)).to.be.bignumber.equal(payment);
        await this.contract.release(payee2);
        expect(await this.contract.releasable(payee2)).to.be.bignumber.equal('0');
        expect(await this.contract.released(payee2)).to.be.bignumber.equal(payment);
      });

      it('Token', async function () {
        await this.token.transfer(this.contract.address, amount, { from: owner });
        const payment = amount.divn(10);
        expect(await this.contract.releasable(this.token.address, payee2, {})).to.be.bignumber.equal(payment);
        await this.contract.release(this.token.address, payee2);
        expect(await this.contract.releasable(this.token.address, payee2, {})).to.be.bignumber.equal('0');
        expect(await this.contract.released(this.token.address, payee2)).to.be.bignumber.equal(payment);
      });
    });

    describe('distributes funds to payees', function () {
      it('Ether', async function () {
        await send.ether(payer1, this.contract.address, amount);

        // receive funds
        const initBalance = await balance.current(this.contract.address);
        expect(initBalance).to.be.bignumber.equal(amount);

        // distribute to payees

        const tracker1 = await balance.tracker(payee1);
        const receipt1 = await this.contract.release(payee1);
        const profit1 = await tracker1.delta();
        expect(profit1).to.be.bignumber.equal(ether('0.20'));
        expectEvent(receipt1, 'PaymentReleased', { to: payee1, amount: profit1 });

        const tracker2 = await balance.tracker(payee2);
        const receipt2 = await this.contract.release(payee2);
        const profit2 = await tracker2.delta();
        expect(profit2).to.be.bignumber.equal(ether('0.10'));
        expectEvent(receipt2, 'PaymentReleased', { to: payee2, amount: profit2 });

        const tracker3 = await balance.tracker(payee3);
        const receipt3 = await this.contract.release(payee3);
        const profit3 = await tracker3.delta();
        expect(profit3).to.be.bignumber.equal(ether('0.70'));
        expectEvent(receipt3, 'PaymentReleased', { to: payee3, amount: profit3 });

        // end balance should be zero
        expect(await balance.current(this.contract.address)).to.be.bignumber.equal('0');

        // check correct funds released accounting
        expect(await this.contract.totalReleased()).to.be.bignumber.equal(initBalance);
      });

      it('Token', async function () {
        expect(await this.token.balanceOf(payee1)).to.be.bignumber.equal('0');
        expect(await this.token.balanceOf(payee2)).to.be.bignumber.equal('0');
        expect(await this.token.balanceOf(payee3)).to.be.bignumber.equal('0');

        await this.token.transfer(this.contract.address, amount, { from: owner });

        expectEvent(
          await this.contract.release(this.token.address, payee1),
          'ERC20PaymentReleased',
          { token: this.token.address, to: payee1, amount: ether('0.20') },
        );

        await this.token.transfer(this.contract.address, amount, { from: owner });

        expectEvent(
          await this.contract.release(this.token.address, payee1),
          'ERC20PaymentReleased',
          { token: this.token.address, to: payee1, amount: ether('0.20') },
        );

        expectEvent(
          await this.contract.release(this.token.address, payee2),
          'ERC20PaymentReleased',
          { token: this.token.address, to: payee2, amount: ether('0.20') },
        );

        expectEvent(
          await this.contract.release(this.token.address, payee3),
          'ERC20PaymentReleased',
          { token: this.token.address, to: payee3, amount: ether('1.40') },
        );

        expect(await this.token.balanceOf(payee1)).to.be.bignumber.equal(ether('0.40'));
        expect(await this.token.balanceOf(payee2)).to.be.bignumber.equal(ether('0.20'));
        expect(await this.token.balanceOf(payee3)).to.be.bignumber.equal(ether('1.40'));
      });
    });
  });
});
