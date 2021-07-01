const { constants, expectEvent, expectRevert, time } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');

const ERC20VotesMock = artifacts.require('ERC20VotesMock');
const VestingWallet = artifacts.require('VestingWallet');

const min = (...args) => args.slice(1).reduce((x, y) => x.lt(y) ? x : y, args[0]);

contract('VestingWallet', function (accounts) {
  const [ beneficiary, other ] = accounts;

  const amount = web3.utils.toBN(web3.utils.toWei('100'));
  const duration = web3.utils.toBN(4 * 365 * 86400); // 4 years

  beforeEach(async function () {
    this.start = (await time.latest()).addn(3600); // in 1 hour
    this.token = await ERC20VotesMock.new('Name', 'Symbol');
    this.vesting = await VestingWallet.new(beneficiary, this.start, duration);
    await this.token.mint(this.vesting.address, amount);

    this.schedule = Array(256).fill()
      .map((_, i) => web3.utils.toBN(i).mul(duration).divn(224).add(this.start))
      .map(timestamp => ({
        timestamp,
        vested: min(amount.mul(timestamp.sub(this.start)).div(duration), amount),
      }));
  });

  it('rejects zero address for beneficiary', async function () {
    await expectRevert(
      VestingWallet.new(constants.ZERO_ADDRESS, this.start, duration),
      'VestingWallet: beneficiary is zero address',
    );
  });

  it('check vesting contract', async function () {
    expect(await this.vesting.beneficiary()).to.be.equal(beneficiary);
    expect(await this.vesting.start()).to.be.bignumber.equal(this.start);
    expect(await this.vesting.duration()).to.be.bignumber.equal(duration);
  });

  describe('vesting schedule', function () {
    it('check vesting schedule', async function () {
      for (const { timestamp, vested } of this.schedule) {
        expect(await this.vesting.vestedAmount(this.token.address, timestamp)).to.be.bignumber.equal(vested);
      }
    });

    it('execute vesting schedule', async function () {
      const { tx } = await this.vesting.release(this.token.address);
      await expectEvent.inTransaction(tx, this.vesting, 'TokensReleased', {
        token: this.token.address,
        amount: '0',
      });
      await expectEvent.inTransaction(tx, this.token, 'Transfer', {
        from: this.vesting.address,
        to: beneficiary,
        value: '0',
      });

      // on schedule
      let released = web3.utils.toBN(0);
      for (const { timestamp, vested } of this.schedule) {
        await new Promise(resolve => web3.currentProvider.send({
          method: 'evm_setNextBlockTimestamp',
          params: [ timestamp.toNumber() ],
        }, resolve));

        const { tx } = await this.vesting.release(this.token.address);
        await expectEvent.inTransaction(tx, this.vesting, 'TokensReleased', {
          token: this.token.address,
          amount: vested.sub(released),
        });
        await expectEvent.inTransaction(tx, this.token, 'Transfer', {
          from: this.vesting.address,
          to: beneficiary,
          value: vested.sub(released),
        });

        released = vested;

        expect(await this.token.balanceOf(this.vesting.address)).to.be.bignumber.equal(amount.sub(vested));
        expect(await this.token.balanceOf(beneficiary)).to.be.bignumber.equal(vested);
      }
    });
  });

  describe('delegate vote', function () {
    it('wrong caller', async function () {
      expect(await this.token.delegates(this.vesting.address)).to.be.equal(constants.ZERO_ADDRESS);

      await expectRevert(
        this.vesting.delegate(this.token.address, other, { from: other }),
        'VestingWallet: access restricted to beneficiary',
      );

      expect(await this.token.delegates(this.vesting.address)).to.be.equal(constants.ZERO_ADDRESS);
    });

    it('authorized call', async function () {
      expect(await this.token.delegates(this.vesting.address)).to.be.equal(constants.ZERO_ADDRESS);

      const { tx } = await this.vesting.delegate(this.token.address, other, { from: beneficiary });
      await expectEvent.inTransaction(tx, this.token, 'DelegateChanged', {
        delegator: this.vesting.address,
        fromDelegate: constants.ZERO_ADDRESS,
        toDelegate: other,
      });
      await expectEvent.inTransaction(tx, this.token, 'DelegateVotesChanged', {
        delegate: other,
        previousBalance: '0',
        newBalance: amount,
      });

      expect(await this.token.delegates(this.vesting.address)).to.be.equal(other);
    });
  });
});
