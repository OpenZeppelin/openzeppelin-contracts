const { constants, expectEvent, expectRevert, time } = require('@openzeppelin/test-helpers');
const { web3 } = require('@openzeppelin/test-helpers/src/setup');
const { expect } = require('chai');

const VestingWallet = artifacts.require('VestingWallet');
const ERC20 = artifacts.require('$ERC20');

const { shouldBehaveLikeVesting } = require('./VestingWallet.behavior');

const min = (...args) => args.slice(1).reduce((x, y) => (x.lt(y) ? x : y), args[0]);

contract('VestingWallet', function (accounts) {
  const [sender, beneficiary] = accounts;

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
      this.schedule = Array(64)
        .fill()
        .map((_, i) => web3.utils.toBN(i).mul(duration).divn(60).add(this.start));
      this.vestingFn = timestamp => min(amount, amount.mul(timestamp.sub(this.start)).div(duration));
    });

    describe('Eth vesting', function () {
      beforeEach(async function () {
        await web3.eth.sendTransaction({ from: sender, to: this.mock.address, value: amount });
        this.getBalance = account => web3.eth.getBalance(account).then(web3.utils.toBN);
        this.checkRelease = () => {};
      });

      shouldBehaveLikeVesting(beneficiary);
    });

    describe('ERC20 vesting', function () {
      beforeEach(async function () {
        this.token = await ERC20.new('Name', 'Symbol');
        this.getBalance = account => this.token.balanceOf(account);
        this.checkRelease = (receipt, to, value) =>
          expectEvent.inTransaction(receipt.tx, this.token, 'Transfer', { from: this.mock.address, to, value });

        await this.token.$_mint(this.mock.address, amount);
      });

      shouldBehaveLikeVesting(beneficiary);
    });
  });
});
