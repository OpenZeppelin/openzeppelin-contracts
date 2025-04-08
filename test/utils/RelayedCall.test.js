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

  it('call success', async function () {
    await expect(
      this.mock.$_relayedCallStrict(this.target, this.target.interface.encodeFunctionData('fnUnrestricted', [])),
    )
      .to.emit(this.target, 'CalledUnrestricted')
      .withArgs(this.relayer);
  });

  it('call success with value', async function () {
    const value = 42n;
    await expect(this.mock.$_relayedCallStrict(this.receiver, value, '0x', { value })).to.changeEtherBalances(
      [this.mock, this.relayer, this.receiver],
      [0n, 0n, value],
    );
  });

  it('call failure', async function () {
    await expect(
      this.mock.$_relayedCallStrict(this.target, this.target.interface.encodeFunctionData('fnRestricted', [])),
    )
      .to.be.revertedWithCustomError(this.target, 'AccessManagedUnauthorized')
      .withArgs(this.relayer);
  });
});
