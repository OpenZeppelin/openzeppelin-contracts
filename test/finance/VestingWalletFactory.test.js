const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

const time = require('../helpers/time');

async function fixture() {
  const amount = ethers.parseEther('1000');
  const duration = time.duration.years(4);
  const start = (await time.clock.timestamp()) + time.duration.hours(1);

  const [owner, beneficiary, other] = await ethers.getSigners();

  const factory = await ethers.deployContract('VestingWalletFactory', [owner.address]);
  const token = await ethers.deployContract('$ERC20', ['Test Token', 'TT']);

  // Mint tokens to owner; schedules are funded via safeTransferFrom
  await token.$_mint(owner.address, amount * 10n);
  await token.connect(owner).approve(factory.target, ethers.MaxUint256);

  return { factory, token, owner, beneficiary, other, amount, start, duration };
}

describe('VestingWalletFactory', function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  describe('createVestingSchedule input validation', function () {
    it('rejects zero address beneficiary', async function () {
      await expect(
        this.factory.createVestingSchedule(
          ethers.ZeroAddress,
          this.token.target,
          this.start,
          this.duration,
          this.amount,
        ),
      ).to.be.revertedWith('VestingWalletFactory: beneficiary is zero address');
    });

    it('rejects zero amount', async function () {
      await expect(
        this.factory.createVestingSchedule(
          this.beneficiary.address,
          this.token.target,
          this.start,
          this.duration,
          0n,
        ),
      ).to.be.revertedWith('VestingWalletFactory: amount is zero');
    });

    it('rejects zero duration', async function () {
      await expect(
        this.factory.createVestingSchedule(
          this.beneficiary.address,
          this.token.target,
          this.start,
          0n,
          this.amount,
        ),
      ).to.be.revertedWith('VestingWalletFactory: duration is zero');
    });
  });

  describe('access control', function () {
    it('reverts when called by non-owner', async function () {
      await expect(
        this.factory.connect(this.other).createVestingSchedule(
          this.beneficiary.address,
          this.token.target,
          this.start,
          this.duration,
          this.amount,
        ),
      )
        .to.be.revertedWithCustomError(this.factory, 'OwnableUnauthorizedAccount')
        .withArgs(this.other.address);
    });
  });

  describe('after createVestingSchedule', function () {
    beforeEach(async function () {
      this.tx = await this.factory.createVestingSchedule(
        this.beneficiary.address,
        this.token.target,
        this.start,
        this.duration,
        this.amount,
      );
    });

    it('stores the schedule correctly', async function () {
      const s = await this.factory.getSchedule(0n);
      expect(s.beneficiary).to.equal(this.beneficiary.address);
      expect(s.token).to.equal(this.token.target);
      expect(s.start).to.equal(this.start);
      expect(s.duration).to.equal(this.duration);
      expect(s.totalAllocation).to.equal(this.amount);
      expect(s.released).to.equal(0n);
    });

    it('increments scheduleCount', async function () {
      expect(await this.factory.scheduleCount()).to.equal(1n);
    });

    it('pulls tokens from the caller into the contract', async function () {
      await expect(this.tx).to.changeTokenBalances(
        this.token,
        [this.owner, this.factory],
        [-this.amount, this.amount],
      );
    });

    it('emits VestingScheduleCreated', async function () {
      await expect(this.tx)
        .to.emit(this.factory, 'VestingScheduleCreated')
        .withArgs(0n, this.beneficiary.address, this.token.target, this.start, this.duration, this.amount);
    });
  });
});
