const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

const time = require('../helpers/time');

async function fixture() {
  const amount = ethers.parseEther('100');
  const duration = time.duration.years(4);
  const start = (await time.clock.timestamp()) + time.duration.hours(1);

  const [sender, beneficiary, revoker, other] = await ethers.getSigners();
  const mock = await ethers.deployContract('VestingWalletRevocable', [beneficiary, revoker, start, duration]);

  const token = await ethers.deployContract('$ERC20', ['Name', 'Symbol']);
  await token.$_mint(mock, amount);
  await sender.sendTransaction({ to: mock, value: amount });

  return { mock, token, amount, duration, start, beneficiary, revoker, other };
}

describe('VestingWalletRevocable', function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  it('sets the beneficiary as the owner and stores the revoker', async function () {
    expect(await this.mock.owner()).to.equal(this.beneficiary);
    expect(await this.mock.revoker()).to.equal(this.revoker);
  });

  it('rejects the zero address revoker', async function () {
    await expect(
      ethers.deployContract('VestingWalletRevocable', [
        this.beneficiary,
        ethers.ZeroAddress,
        this.start,
        this.duration,
      ]),
    )
      .to.be.revertedWithCustomError(this.mock, 'VestingWalletInvalidRevoker')
      .withArgs(ethers.ZeroAddress);
  });

  it('only allows the revoker to revoke', async function () {
    await expect(this.mock.connect(this.other).revoke())
      .to.be.revertedWithCustomError(this.mock, 'VestingWalletUnauthorizedRevoker')
      .withArgs(this.other.address);

    await expect(this.mock.connect(this.other).revoke(ethers.Typed.address(this.token)))
      .to.be.revertedWithCustomError(this.mock, 'VestingWalletUnauthorizedRevoker')
      .withArgs(this.other.address);
  });

  it('freezes Ether vesting on revoke and keeps the vested portion claimable', async function () {
    const quarter = this.start + this.duration / 4n;
    const halfway = this.start + this.duration / 2n;

    await time.increaseTo.timestamp(quarter, false);
    const quarterReleasable = (await this.mock.vestedAmount(quarter)) - (await this.mock.released());
    await expect(() => this.mock.release()).to.changeEtherBalances(
      [this.mock, this.beneficiary],
      [-quarterReleasable, quarterReleasable],
    );

    await time.increaseTo.timestamp(halfway, false);

    const totalAllocation = (await ethers.provider.getBalance(this.mock)) + (await this.mock.released());
    const refund = totalAllocation - (await this.mock.vestedAmount(halfway));

    await expect(() => this.mock.connect(this.revoker).revoke()).to.changeEtherBalances(
      [this.mock, this.revoker],
      [-refund, refund],
    );

    await expect(this.mock.connect(this.revoker).revoke()).to.be.revertedWithCustomError(
      this.mock,
      'VestingWalletEtherAlreadyRevoked',
    );
  });

  it('does not increase releasable Ether after revocation', async function () {
    const halfway = this.start + this.duration / 2n;

    await time.increaseTo.timestamp(halfway, false);
    const releasableAtHalfway = (await this.mock.vestedAmount(halfway)) - (await this.mock.released());
    const refund =
      (await ethers.provider.getBalance(this.mock)) +
      (await this.mock.released()) -
      (await this.mock.vestedAmount(halfway));
    await expect(() => this.mock.connect(this.revoker).revoke()).to.changeEtherBalances(
      [this.mock, this.revoker],
      [-refund, refund],
    );

    const releasableAtRevocation = await this.mock.releasable();
    expect(releasableAtRevocation).to.equal(releasableAtHalfway);
    await time.increaseTo.timestamp(this.start + this.duration);
    expect(await this.mock.releasable()).to.equal(releasableAtRevocation);

    await expect(() => this.mock.release()).to.changeEtherBalances(
      [this.mock, this.beneficiary],
      [-releasableAtRevocation, releasableAtRevocation],
    );

    expect(await this.mock.releasable()).to.equal(0n);
  });

  it('freezes ERC20 vesting on revoke and keeps the vested portion claimable', async function () {
    const token = ethers.Typed.address(this.token);
    const halfway = this.start + this.duration / 2n;

    await time.increaseTo.timestamp(halfway, false);
    const totalAllocation = (await this.token.balanceOf(this.mock)) + (await this.mock.released(token));
    const refund = totalAllocation - (await this.mock.vestedAmount(token, halfway));
    await expect(() => this.mock.connect(this.revoker).revoke(token)).to.changeTokenBalances(
      this.token,
      [this.mock, this.revoker],
      [-refund, refund],
    );

    const releasableAtRevocation = await this.mock.releasable(token);
    await time.increaseTo.timestamp(this.start + this.duration);
    expect(await this.mock.releasable(token)).to.equal(releasableAtRevocation);

    await expect(() => this.mock.release(token)).to.changeTokenBalances(
      this.token,
      [this.mock, this.beneficiary],
      [-releasableAtRevocation, releasableAtRevocation],
    );

    expect(await this.mock.releasable(token)).to.equal(0n);
  });

  it('cannot revoke the same ERC20 twice', async function () {
    const token = ethers.Typed.address(this.token);
    const halfway = this.start + this.duration / 2n;

    await time.increaseTo.timestamp(halfway, false);
    await this.mock.connect(this.revoker).revoke(token);

    await expect(this.mock.connect(this.revoker).revoke(token))
      .to.be.revertedWithCustomError(this.mock, 'VestingWalletERC20AlreadyRevoked')
      .withArgs(this.token);
  });

  it('cannot revoke Ether twice', async function () {
    const halfway = this.start + this.duration / 2n;

    await time.increaseTo.timestamp(halfway, false);
    await this.mock.connect(this.revoker).revoke();

    await expect(this.mock.connect(this.revoker).revoke()).to.be.revertedWithCustomError(
      this.mock,
      'VestingWalletEtherAlreadyRevoked',
    );
  });
});
