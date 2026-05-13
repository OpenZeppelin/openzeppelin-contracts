const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

const { min } = require('../helpers/math');
const time = require('../helpers/time');

const { envSetup, shouldBehaveLikeVesting } = require('./VestingWallet.behavior');

async function fixture() {
  const amount = ethers.parseEther('100');
  const duration = time.duration.years(4);
  const start = (await time.clock.timestamp()) + time.duration.hours(1);

  const [sender, beneficiary] = await ethers.getSigners();
  const mock = await ethers.deployContract('$VestingWalletRevocable', [beneficiary, start, duration]);

  const token = await ethers.deployContract('$ERC20', ['Name', 'Symbol']);
  await token.$_mint(mock, amount);
  await sender.sendTransaction({ to: mock, value: amount });

  const env = await envSetup(mock, beneficiary, token);

  const schedule = Array.from({ length: 64 }, (_, i) => (BigInt(i) * duration) / 60n + start);
  const vestingFn = timestamp => min(amount, (amount * (timestamp - start)) / duration);

  return { mock, duration, start, beneficiary, token, env, schedule, vestingFn };
}

describe('VestingWalletRevocable', function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  it('check vesting contract', async function () {
    expect(await this.mock.owner()).to.equal(this.beneficiary);
    expect(await this.mock.start()).to.equal(this.start);
    expect(await this.mock.duration()).to.equal(this.duration);
    expect(await this.mock.end()).to.equal(this.start + this.duration);
    expect(await this.mock.isRevoked()).to.be.false;
  });

  describe('vesting schedule', function () {
    describe('Eth vesting', function () {
      beforeEach(async function () {
        Object.assign(this, this.env.eth);
      });

      shouldBehaveLikeVesting();
    });

    describe('ERC20 vesting', function () {
      beforeEach(async function () {
        Object.assign(this, this.env.token);
      });

      shouldBehaveLikeVesting();
    });
  });

  describe('revoke', function () {
    it('reverts when caller is not owner', async function () {
      const [, , other] = await ethers.getSigners();
      await expect(this.mock.connect(other).revoke([]))
        .to.be.revertedWithCustomError(this.mock, 'OwnableUnauthorizedAccount')
        .withArgs(other.address);
    });

    it('reverts on second revoke', async function () {
      await this.mock.connect(this.beneficiary).revoke([this.token.target]);
      await expect(this.mock.connect(this.beneficiary).revoke([this.token.target])).to.be.revertedWithCustomError(
        this.mock,
        'AlreadyRevoked',
      );
    });

    it('returns unvested funds to owner', async function () {
      await time.increaseTo.timestamp(this.start + this.duration / 4n, false);
      const tx = await this.mock.connect(this.beneficiary).revoke([this.token.target]);
      const unvested = ethers.parseEther('75');

      await expect(tx).to.emit(this.mock, 'VestingRevoked').withArgs(this.beneficiary.address);
      await expect(tx).to.changeEtherBalances([this.mock, this.beneficiary], [-unvested, unvested]);
      await expect(tx).to.changeTokenBalances(this.token, [this.mock, this.beneficiary], [-unvested, unvested]);
      expect(await this.mock.isRevoked()).to.be.true;
    });

    it('freezes vested amount at revocation timestamp', async function () {
      const revokeAt = this.start + this.duration / 4n;
      await time.increaseTo.timestamp(revokeAt, false);
      const vestedAtRevoke = await this.mock.vestedAmount(revokeAt);
      await this.mock.connect(this.beneficiary).revoke([this.token.target]);

      await time.increaseTo.timestamp(this.start + this.duration);
      expect(await this.mock.vestedAmount(this.start + this.duration)).to.equal(vestedAtRevoke);
    });

    it('keeps un-listed token vesting against on-chain balance', async function () {
      const other = await ethers.deployContract('$ERC20', ['Other', 'OTH']);
      await other.$_mint(this.mock, ethers.parseEther('100'));

      await time.increaseTo.timestamp(this.start + this.duration / 4n, false);
      await this.mock.connect(this.beneficiary).revoke([this.token.target]);

      await time.increaseTo.timestamp(this.start + this.duration);
      expect(await this.mock.releasable(ethers.Typed.address(other))).to.equal(ethers.parseEther('25'));
    });
  });
});
