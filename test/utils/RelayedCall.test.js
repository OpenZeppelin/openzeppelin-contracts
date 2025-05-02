const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

async function fixture() {
  const [admin, receiver] = await ethers.getSigners();

  const mock = await ethers.deployContract('$RelayedCall');
  const relayer = await mock._relayer();

  const authority = await ethers.deployContract('$AccessManager', [admin]);
  const target = await ethers.deployContract('$AccessManagedTarget', [authority]);

  return { mock, relayer, target, receiver };
}

describe('RelayedCall', function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  describe('relayed call', function () {
    it('target success', async function () {
      await expect(
        this.mock.$_relayedCallStrict(this.target, this.target.interface.encodeFunctionData('fnUnrestricted', [])),
      )
        .to.emit(this.target, 'CalledUnrestricted')
        .withArgs(this.relayer);
    });

    it('target success (with value)', async function () {
      const value = 42n;
      await expect(this.mock.$_relayedCallStrict(this.receiver, value, '0x', { value })).to.changeEtherBalances(
        [this.mock, this.relayer, this.receiver],
        [0n, 0n, value],
      );
    });

    it('target revert', async function () {
      await expect(
        this.mock.$_relayedCallStrict(this.target, this.target.interface.encodeFunctionData('fnRestricted', [])),
      )
        .to.be.revertedWithCustomError(this.target, 'AccessManagedUnauthorized')
        .withArgs(this.relayer);
    });
  });

  it('direct call to the relayer', async function () {
    // 20 bytes (address + empty data) - OK
    await expect(
      this.mock.runner.sendTransaction({ to: this.relayer, data: '0x7859821024E633C5dC8a4FcF86fC52e7720Ce525' }),
    ).to.not.be.reverted;

    // 19 bytes (not enough for an address) - REVERT
    await expect(
      this.mock.runner.sendTransaction({ to: this.relayer, data: '0x7859821024E633C5dC8a4FcF86fC52e7720Ce5' }),
    ).to.be.revertedWithoutReason();

    // 0 bytes (not enough for an address) - REVERT
    await expect(this.mock.runner.sendTransaction({ to: this.relayer, data: '0x' })).to.be.revertedWithoutReason();
  });
});
