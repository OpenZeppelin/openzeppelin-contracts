const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');
const { bigint: time } = require('../helpers/time');
const { min } = require('../helpers/math');

const { shouldBehaveLikeVesting } = require('./VestingWallet.behavior');

async function fixture() {
  const amount = ethers.parseEther('100');
  const duration = time.duration.years(4);
  const start = (await time.clock.timestamp()) + time.duration.hours(1);

  const [sender, beneficiary] = await ethers.getSigners();
  const mock = await ethers.deployContract('VestingWallet', [beneficiary, start, duration]);
  return { mock, amount, duration, start, sender, beneficiary };
}

describe('VestingWallet', function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  it('rejects zero address for beneficiary', async function () {
    await expect(ethers.deployContract('VestingWallet', [ethers.ZeroAddress, this.start, this.duration]))
      .revertedWithCustomError(this.mock, 'OwnableInvalidOwner')
      .withArgs(ethers.ZeroAddress);
  });

  it('check vesting contract', async function () {
    expect(await this.mock.owner()).to.be.equal(this.beneficiary.address);
    expect(await this.mock.start()).to.be.equal(this.start);
    expect(await this.mock.duration()).to.be.equal(this.duration);
    expect(await this.mock.end()).to.be.equal(this.start + this.duration);
  });

  describe('vesting schedule', function () {
    beforeEach(function () {
      this.schedule = Array(64)
        .fill()
        .map((_, i) => (BigInt(i) * this.duration) / 60n + this.start);
      this.vestingFn = timestamp => min(this.amount, (this.amount * (timestamp - this.start)) / this.duration);
    });

    describe('Eth vesting', function () {
      beforeEach(async function () {
        await this.sender.sendTransaction({ to: this.mock, value: this.amount });

        this.getBalance = signer => ethers.provider.getBalance(signer);
        this.checkRelease = (tx, amount) => expect(tx).to.changeEtherBalances([this.beneficiary], [amount]);

        this.releasedEvent = 'EtherReleased';
        this.args = [];
        this.argsVerify = [];
      });

      shouldBehaveLikeVesting();
    });

    describe('ERC20 vesting', function () {
      beforeEach(async function () {
        this.token = await ethers.deployContract('$ERC20', ['Name', 'Symbol']);
        await this.token.$_mint(this.mock, this.amount);

        this.getBalance = account => this.token.balanceOf(account);
        this.checkRelease = async (tx, amount) => {
          await expect(tx).to.emit(this.token, 'Transfer').withArgs(this.mock.target, this.beneficiary.address, amount);
          await expect(tx).to.changeTokenBalances(this.token, [this.mock, this.beneficiary], [-amount, amount]);
        };

        this.releasedEvent = 'ERC20Released';
        this.args = [ethers.Typed.address(this.token.target)];
        this.argsVerify = [this.token.target];
      });

      shouldBehaveLikeVesting();
    });
  });
});
