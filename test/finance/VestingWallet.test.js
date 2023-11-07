const { constants, expectEvent } = require('@openzeppelin/test-helpers');
const { web3 } = require('@openzeppelin/test-helpers/src/setup');
const { expect } = require('chai');
const { BNmin } = require('../helpers/math');
const { expectRevertCustomError } = require('../helpers/customError');

const { ethers } = require('hardhat');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');
const { bigint: time } = require('../helpers/time');

const VestingWallet = artifacts.require('VestingWallet');
const ERC20 = artifacts.require('$ERC20');

const { shouldBehaveLikeVesting } = require('./VestingWallet.behavior');

async function fixture() {
  const amount = ethers.parseEther('100');
  const duration = time.duration.years(4);
  const start = (await time.clock.timestamp()) + time.duration.hours(1);

  const [sender, beneficiary, ...accounts] = await ethers.getSigners();
  const mock = await ethers.deployContract('VestingWallet', [beneficiary, start, duration]);
  return { mock, amount, duration, start, sender, beneficiary, accounts };
}

contract('VestingWallet', function (accounts) {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  it.only('rejects zero address for beneficiary', async function () {
    const tx = ethers.deployContract('VestingWallet', [ethers.ZeroAddress, this.start, this.duration]);
    await expect(tx)
      .revertedWithCustomError(this.mock, 'OwnableInvalidOwner')
      .withArgs(ethers.ZeroAddress);
  });

  it('check vesting contract', async function () {
    expect(await this.mock.owner()).to.be.equal(beneficiary);
    expect(await this.mock.start()).to.be.bignumber.equal(this.start);
    expect(await this.mock.duration()).to.be.bignumber.equal(duration);
    expect(await this.mock.end()).to.be.bignumber.equal(this.start.add(duration));
  });

  describe('vesting schedule', function () {
    beforeEach(async function () {
      this.schedule = Array(64)
        .fill()
        .map((_, i) => web3.utils.toBN(i).mul(duration).divn(60).add(this.start));
      this.vestingFn = timestamp => BNmin(amount, amount.mul(timestamp.sub(this.start)).div(duration));
    });

    describe('Eth vesting', function () {
      beforeEach(async function () {
        await web3.eth.sendTransaction({ from: sender, to: this.mock.address, value: amount });
        this.getBalance = account => web3.eth.getBalance(account).then(web3.utils.toBN);
        this.checkRelease = () => {};
      });

      shouldBehaveLikeVesting();
    });

    describe('ERC20 vesting', function () {
      beforeEach(async function () {
        this.token = await ERC20.new('Name', 'Symbol');
        this.getBalance = account => this.token.balanceOf(account);
        this.checkRelease = (receipt, to, value) =>
          expectEvent.inTransaction(receipt.tx, this.token, 'Transfer', { from: this.mock.address, to, value });

        await this.token.$_mint(this.mock.address, amount);
      });

      shouldBehaveLikeVesting();
    });
  });
});
