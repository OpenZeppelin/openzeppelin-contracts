const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

const { getAddressInSlot, ImplementationSlot } = require('../../helpers/erc1967');

async function fixture() {
  const implInitial = await ethers.deployContract('UUPSUpgradeableMock');
  const implUpgradeOk = await ethers.deployContract('UUPSUpgradeableMock');
  const implUpgradeUnsafe = await ethers.deployContract('UUPSUpgradeableUnsafeMock');
  const implUpgradeNonUUPS = await ethers.deployContract('NonUpgradeableMock');
  const implUnsupportedUUID = await ethers.deployContract('UUPSUnsupportedProxiableUUID');
  // Used for testing non ERC1967 compliant proxies (clones are proxies that don't use the ERC1967 implementation slot)
  const cloneFactory = await ethers.deployContract('$Clones');

  const proxy = await ethers.deployContract('ERC1967Proxy', [implInitial, '0x']);
  const instance = await ethers.getContractAt('UUPSUpgradeableMock', proxy);

  return {
    implInitial,
    implUpgradeOk,
    implUpgradeUnsafe,
    implUpgradeNonUUPS,
    implUnsupportedUUID,
    cloneFactory,
    instance,
  };
}

describe('UUPSUpgradeable', function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  it('has an interface version', async function () {
    expect(await this.instance.UPGRADE_INTERFACE_VERSION()).to.equal('5.0.0');
  });

  it('upgrade to upgradeable implementation', async function () {
    const tx = await this.instance.upgradeToAndCall(this.implUpgradeOk, '0x');
    await expect(tx).to.emit(this.instance, 'Upgraded').withArgs(this.implUpgradeOk.target);
    expect(await getAddressInSlot(this.instance, ImplementationSlot)).to.be.equal(this.implUpgradeOk.target);
  });

  it('upgrade to upgradeable implementation with call', async function () {
    expect(await this.instance.current()).to.be.equal(0n);

    const tx = await this.instance.upgradeToAndCall(
      this.implUpgradeOk,
      this.implUpgradeOk.interface.encodeFunctionData('increment'),
    );
    await expect(tx).to.emit(this.instance, 'Upgraded').withArgs(this.implUpgradeOk.target);
    expect(await getAddressInSlot(this.instance, ImplementationSlot)).to.be.equal(this.implUpgradeOk.target);

    expect(await this.instance.current()).to.be.equal(1n);
  });

  it('calling upgradeTo on the implementation reverts', async function () {
    await expect(this.implInitial.upgradeToAndCall(this.implUpgradeOk, '0x')).to.be.revertedWithCustomError(
      this.implInitial,
      'UUPSUnauthorizedCallContext',
    );
  });

  it('calling upgradeToAndCall on the implementation reverts', async function () {
    await expect(
      this.implInitial.upgradeToAndCall(
        this.implUpgradeOk,
        this.implUpgradeOk.interface.encodeFunctionData('increment'),
      ),
    ).to.be.revertedWithCustomError(this.implUpgradeOk, 'UUPSUnauthorizedCallContext');
  });

  it('calling upgradeTo from a contract that is not an ERC1967 proxy (with the right implementation) reverts', async function () {
    const instanceAddress = await await this.cloneFactory.$clone.staticCall(this.implUpgradeOk);
    await this.cloneFactory.$clone(this.implUpgradeOk);
    const instance = await ethers.getContractAt('UUPSUpgradeableMock', instanceAddress);

    await expect(instance.upgradeToAndCall(this.implUpgradeUnsafe, '0x')).to.be.revertedWithCustomError(
      instance,
      'UUPSUnauthorizedCallContext',
    );
  });

  it('calling upgradeToAndCall from a contract that is not an ERC1967 proxy (with the right implementation) reverts', async function () {
    const instanceAddress = await this.cloneFactory.$clone.staticCall(this.implUpgradeOk);
    await this.cloneFactory.$clone(this.implUpgradeOk);
    const instance = await ethers.getContractAt('UUPSUpgradeableMock', instanceAddress);

    await expect(instance.upgradeToAndCall(this.implUpgradeUnsafe, '0x')).to.be.revertedWithCustomError(
      instance,
      'UUPSUnauthorizedCallContext',
    );
  });

  it('rejects upgrading to an unsupported UUID', async function () {
    await expect(this.instance.upgradeToAndCall(this.implUnsupportedUUID, '0x'))
      .to.be.revertedWithCustomError(this.instance, 'UUPSUnsupportedProxiableUUID')
      .withArgs(ethers.id('invalid UUID'));
  });

  it('upgrade to and unsafe upgradeable implementation', async function () {
    const tx = await this.instance.upgradeToAndCall(this.implUpgradeUnsafe, '0x');
    await expect(tx).to.emit(this.instance, 'Upgraded').withArgs(this.implUpgradeUnsafe.target);
    expect(await getAddressInSlot(this.instance, ImplementationSlot)).to.be.equal(this.implUpgradeUnsafe.target);
  });

  // delegate to a non existing upgradeTo function causes a low level revert
  it('reject upgrade to non uups implementation', async function () {
    await expect(this.instance.upgradeToAndCall(this.implUpgradeNonUUPS, '0x'))
      .to.be.revertedWithCustomError(this.instance, 'ERC1967InvalidImplementation')
      .withArgs(this.implUpgradeNonUUPS.target);
  });

  it('reject proxy address as implementation', async function () {
    const proxy = await ethers.deployContract('ERC1967Proxy', [this.implInitial, '0x']);
    const otherInstance = await ethers.getContractAt('UUPSUpgradeableMock', proxy);

    await expect(this.instance.upgradeToAndCall(otherInstance, '0x'))
      .to.be.revertedWithCustomError(this.instance, 'ERC1967InvalidImplementation')
      .withArgs(otherInstance.target);
  });
});
