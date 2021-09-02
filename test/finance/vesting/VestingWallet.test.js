const { constants, expectEvent, expectRevert, time } = require('@openzeppelin/test-helpers');
const { web3 } = require('@openzeppelin/test-helpers/src/setup');
const { expect } = require('chai');

const ERC20Mock = artifacts.require('ERC20Mock');
const VestingWallet = artifacts.require('VestingWallet');

const min = (...args) => args.slice(1).reduce((x, y) => x.lt(y) ? x : y, args[0]);

contract('VestingWallet', function (accounts) {
  const [ sender, beneficiary ] = accounts;

  const amount = web3.utils.toBN(web3.utils.toWei('100'));
  const duration = web3.utils.toBN(4 * 365 * 86400); // 4 years

  beforeEach(async function () {
    this.start = (await time.latest()).addn(3600); // in 1 hour
    this.mock = await VestingWallet.new(beneficiary, this.start, duration);
  });

  it('rejects zero address for beneficiary', async function () {
    await expectRevert(
      VestingWallet.new(constants.ZERO_ADDRESS, this.start, duration),
      'VestingWallet: beneficiary is zero address',
    );
  });

  it('check vesting contract', async function () {
    expect(await this.mock.beneficiary()).to.be.equal(beneficiary);
    expect(await this.mock.start()).to.be.bignumber.equal(this.start);
    expect(await this.mock.duration()).to.be.bignumber.equal(duration);
  });

  describe('vesting schedule', function () {
    beforeEach(async function () {
      this.schedule = Array(256).fill().map((_, i) => web3.utils.toBN(i).mul(duration).divn(224).add(this.start));
      this.vestingFn = timestamp => min(amount, amount.mul(timestamp.sub(this.start)).div(duration));
    });

    describe('Eth vesting', function () {
      beforeEach(async function () {
        await web3.eth.sendTransaction({ from: sender, to: this.mock.address, value: amount });
      });

      it('check vesting schedule', async function () {
        for (const timestamp of this.schedule) {
          expect(await this.mock.vestedAmount(constants.ZERO_ADDRESS, timestamp))
            .to.be.bignumber.equal(this.vestingFn(timestamp));
        }
      });

      it('execute vesting schedule', async function () {
        let released = web3.utils.toBN(0);
        const balanceBefore = await web3.eth.getBalance(beneficiary).then(web3.utils.toBN);

        {
          const receipt = await this.mock.release();

          await expectEvent.inTransaction(receipt.tx, this.mock, 'TokensReleased', {
            token: constants.ZERO_ADDRESS,
            amount: '0',
          });

          expect(await web3.eth.getBalance(beneficiary).then(web3.utils.toBN)).to.be.bignumber.equal(balanceBefore);
        }


        for (const timestamp of this.schedule) {
          const vested = this.vestingFn(timestamp);

          await new Promise(resolve => web3.currentProvider.send({
            method: 'evm_setNextBlockTimestamp',
            params: [ timestamp.toNumber() ],
          }, resolve));

          const receipt = await this.mock.release();

          await expectEvent.inTransaction(receipt.tx, this.mock, 'TokensReleased', {
            token: constants.ZERO_ADDRESS,
            amount: vested.sub(released),
          });

          expect(await web3.eth.getBalance(beneficiary).then(web3.utils.toBN)).to.be.bignumber.equal(balanceBefore.add(vested));

          released = vested;
        }
      });
    });

    describe('ERC20 vesting', function () {
      beforeEach(async function () {
        this.token = await ERC20Mock.new('Name', 'Symbol', this.mock.address, amount);
      });

      it('check vesting schedule', async function () {
        for (const timestamp of this.schedule) {
          expect(await this.mock.vestedAmount(this.token.address, timestamp))
            .to.be.bignumber.equal(this.vestingFn(timestamp));
        }
      });

      it('execute vesting schedule', async function () {
        let released = web3.utils.toBN(0);

        {
          const receipt = await this.mock.release(this.token.address);

          await expectEvent.inTransaction(receipt.tx, this.mock, 'TokensReleased', {
            token: this.token.address,
            amount: '0',
          });

          await expectEvent.inTransaction(receipt.tx, this.token, 'Transfer', {
            from: this.mock.address,
            to: beneficiary,
            value: '0',
          });
        }

        for (const timestamp of this.schedule) {
          const vested = this.vestingFn(timestamp);

          await new Promise(resolve => web3.currentProvider.send({
            method: 'evm_setNextBlockTimestamp',
            params: [ timestamp.toNumber() ],
          }, resolve));

          const receipt = await this.mock.release(this.token.address);

          await expectEvent.inTransaction(receipt.tx, this.mock, 'TokensReleased', {
            token: this.token.address,
            amount: vested.sub(released),
          });

          await expectEvent.inTransaction(receipt.tx, this.token, 'Transfer', {
            from: this.mock.address,
            to: beneficiary,
            value: vested.sub(released),
          });

          released = vested;
        }
      });
    });
  });
});
