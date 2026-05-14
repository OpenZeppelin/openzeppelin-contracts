const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

const time = require('../helpers/time');

async function fixture() {
  const amount = ethers.parseEther('1000');
  const duration = time.duration.years(4);
  const start = (await time.clock.timestamp()) + time.duration.hours(1);

  const [owner, beneficiary] = await ethers.getSigners();

  const factory = await ethers.deployContract('VestingWalletFactory', [owner.address]);
  const token = await ethers.deployContract('$ERC20', ['Test Token', 'TT']);

  // Mint tokens to owner; schedules are funded via safeTransferFrom
  await token.$_mint(owner.address, amount * 10n);
  await token.connect(owner).approve(factory.target, ethers.MaxUint256);

  return { factory, token, owner, beneficiary, amount, start, duration };
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
});
