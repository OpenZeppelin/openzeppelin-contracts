const { accounts, contract } = require('@openzeppelin/test-environment');

const { balance, BN, constants, ether, expectEvent, expectRevert } = require('@openzeppelin/test-helpers');
const { ZERO_ADDRESS } = constants;

const { expect } = require('chai');

const Crowdsale = contract.fromArtifact('CrowdsaleMock');
const SimpleToken = contract.fromArtifact('SimpleToken');

describe('Crowdsale', function () {
  const [ investor, wallet, purchaser ] = accounts;

  const rate = new BN(1);
  const value = ether('42');
  const tokenSupply = new BN('10').pow(new BN('22'));
  const expectedTokenAmount = rate.mul(value);

  it('requires a non-null token', async function () {
    await expectRevert(
      Crowdsale.new(rate, wallet, ZERO_ADDRESS),
      'Crowdsale: token is the zero address'
    );
  });

  context('with token', async function () {
    beforeEach(async function () {
      this.token = await SimpleToken.new();
    });

    it('requires a non-zero rate', async function () {
      await expectRevert(
        Crowdsale.new(0, wallet, this.token.address), 'Crowdsale: rate is 0'
      );
    });

    it('requires a non-null wallet', async function () {
      await expectRevert(
        Crowdsale.new(rate, ZERO_ADDRESS, this.token.address), 'Crowdsale: wallet is the zero address'
      );
    });

    context('once deployed', async function () {
      beforeEach(async function () {
        this.crowdsale = await Crowdsale.new(rate, wallet, this.token.address);
        await this.token.transfer(this.crowdsale.address, tokenSupply);
      });

      describe('accepting payments', function () {
        describe('bare payments', function () {
          it('should accept payments', async function () {
            await this.crowdsale.send(value, { from: purchaser });
          });

          it('reverts on zero-valued payments', async function () {
            await expectRevert(
              this.crowdsale.send(0, { from: purchaser }), 'Crowdsale: weiAmount is 0'
            );
          });
        });

        describe('buyTokens', function () {
          it('should accept payments', async function () {
            await this.crowdsale.buyTokens(investor, { value: value, from: purchaser });
          });

          it('reverts on zero-valued payments', async function () {
            await expectRevert(
              this.crowdsale.buyTokens(investor, { value: 0, from: purchaser }), 'Crowdsale: weiAmount is 0'
            );
          });

          it('requires a non-null beneficiary', async function () {
            await expectRevert(
              this.crowdsale.buyTokens(ZERO_ADDRESS, { value: value, from: purchaser }),
              'Crowdsale: beneficiary is the zero address'
            );
          });
        });
      });

      describe('high-level purchase', function () {
        it('should log purchase', async function () {
          const { logs } = await this.crowdsale.sendTransaction({ value: value, from: investor });
          expectEvent.inLogs(logs, 'TokensPurchased', {
            purchaser: investor,
            beneficiary: investor,
            value: value,
            amount: expectedTokenAmount,
          });
        });

        it('should assign tokens to sender', async function () {
          await this.crowdsale.sendTransaction({ value: value, from: investor });
          expect(await this.token.balanceOf(investor)).to.be.bignumber.equal(expectedTokenAmount);
        });

        it('should forward funds to wallet', async function () {
          const balanceTracker = await balance.tracker(wallet);
          await this.crowdsale.sendTransaction({ value, from: investor });
          expect(await balanceTracker.delta()).to.be.bignumber.equal(value);
        });
      });

      describe('low-level purchase', function () {
        it('should log purchase', async function () {
          const { logs } = await this.crowdsale.buyTokens(investor, { value: value, from: purchaser });
          expectEvent.inLogs(logs, 'TokensPurchased', {
            purchaser: purchaser,
            beneficiary: investor,
            value: value,
            amount: expectedTokenAmount,
          });
        });

        it('should assign tokens to beneficiary', async function () {
          await this.crowdsale.buyTokens(investor, { value, from: purchaser });
          expect(await this.token.balanceOf(investor)).to.be.bignumber.equal(expectedTokenAmount);
        });

        it('should forward funds to wallet', async function () {
          const balanceTracker = await balance.tracker(wallet);
          await this.crowdsale.buyTokens(investor, { value, from: purchaser });
          expect(await balanceTracker.delta()).to.be.bignumber.equal(value);
        });
      });
    });
  });
});
