const { expectEvent } = require('@openzeppelin/test-helpers');
const { getAddressInSlot, ImplementationSlot } = require('../../helpers/erc1967');
const { expectRevertCustomError } = require('../../helpers/customError');

const ERC1967Proxy = artifacts.require('ERC1967Proxy');
const UUPSUpgradeableMock = artifacts.require('UUPSUpgradeableMock');
const UUPSUpgradeableUnsafeMock = artifacts.require('UUPSUpgradeableUnsafeMock');
const NonUpgradeableMock = artifacts.require('NonUpgradeableMock');
const UUPSUnsupportedProxiableUUID = artifacts.require('UUPSUnsupportedProxiableUUID');
const Clones = artifacts.require('$Clones');

contract('UUPSUpgradeable', function () {
  before(async function () {
    this.implInitial = await UUPSUpgradeableMock.new();
    this.implUpgradeOk = await UUPSUpgradeableMock.new();
    this.implUpgradeUnsafe = await UUPSUpgradeableUnsafeMock.new();
    this.implUpgradeNonUUPS = await NonUpgradeableMock.new();
    this.implUnsupportedUUID = await UUPSUnsupportedProxiableUUID.new();
    // Used for testing non ERC1967 compliant proxies (clones are proxies that don't use the ERC1967 implementation slot)
    this.cloneFactory = await Clones.new();
  });

  beforeEach(async function () {
    const { address } = await ERC1967Proxy.new(this.implInitial.address, '0x');
    this.instance = await UUPSUpgradeableMock.at(address);
  });

  it('has an interface version', async function () {
    expect(await this.instance.UPGRADE_INTERFACE_VERSION()).to.equal('5.0.0');
  });

  it('upgrade to upgradeable implementation', async function () {
    const { receipt } = await this.instance.upgradeToAndCall(this.implUpgradeOk.address, '0x');
    expect(receipt.logs.filter(({ event }) => event === 'Upgraded').length).to.be.equal(1);
    expectEvent(receipt, 'Upgraded', { implementation: this.implUpgradeOk.address });
    expect(await getAddressInSlot(this.instance, ImplementationSlot)).to.be.equal(this.implUpgradeOk.address);
  });

  it('upgrade to upgradeable implementation with call', async function () {
    expect(await this.instance.current()).to.be.bignumber.equal('0');

    const { receipt } = await this.instance.upgradeToAndCall(
      this.implUpgradeOk.address,
      this.implUpgradeOk.contract.methods.increment().encodeABI(),
    );
    expect(receipt.logs.filter(({ event }) => event === 'Upgraded').length).to.be.equal(1);
    expectEvent(receipt, 'Upgraded', { implementation: this.implUpgradeOk.address });
    expect(await getAddressInSlot(this.instance, ImplementationSlot)).to.be.equal(this.implUpgradeOk.address);

    expect(await this.instance.current()).to.be.bignumber.equal('1');
  });

  it('calling upgradeTo on the implementation reverts', async function () {
    await expectRevertCustomError(
      this.implInitial.upgradeToAndCall(this.implUpgradeOk.address, '0x'),
      'UUPSUnauthorizedCallContext',
      [],
    );
  });

  it('calling upgradeToAndCall on the implementation reverts', async function () {
    await expectRevertCustomError(
      this.implInitial.upgradeToAndCall(
        this.implUpgradeOk.address,
        this.implUpgradeOk.contract.methods.increment().encodeABI(),
      ),
      'UUPSUnauthorizedCallContext',
      [],
    );
  });

  it('calling upgradeTo from a contract that is not an ERC1967 proxy (with the right implementation) reverts', async function () {
    const receipt = await this.cloneFactory.$clone(this.implUpgradeOk.address);
    const instance = await UUPSUpgradeableMock.at(
      receipt.logs.find(({ event }) => event === 'return$clone').args.instance,
    );

    await expectRevertCustomError(
      instance.upgradeToAndCall(this.implUpgradeUnsafe.address, '0x'),
      'UUPSUnauthorizedCallContext',
      [],
    );
  });

  it('calling upgradeToAndCall from a contract that is not an ERC1967 proxy (with the right implementation) reverts', async function () {
    const receipt = await this.cloneFactory.$clone(this.implUpgradeOk.address);
    const instance = await UUPSUpgradeableMock.at(
      receipt.logs.find(({ event }) => event === 'return$clone').args.instance,
    );

    await expectRevertCustomError(
      instance.upgradeToAndCall(this.implUpgradeUnsafe.address, '0x'),
      'UUPSUnauthorizedCallContext',
      [],
    );
  });

  it('rejects upgrading to an unsupported UUID', async function () {
    await expectRevertCustomError(
      this.instance.upgradeToAndCall(this.implUnsupportedUUID.address, '0x'),
      'UUPSUnsupportedProxiableUUID',
      [web3.utils.keccak256('invalid UUID')],
    );
  });

  it('upgrade to and unsafe upgradeable implementation', async function () {
    const { receipt } = await this.instance.upgradeToAndCall(this.implUpgradeUnsafe.address, '0x');
    expectEvent(receipt, 'Upgraded', { implementation: this.implUpgradeUnsafe.address });
    expect(await getAddressInSlot(this.instance, ImplementationSlot)).to.be.equal(this.implUpgradeUnsafe.address);
  });

  // delegate to a non existing upgradeTo function causes a low level revert
  it('reject upgrade to non uups implementation', async function () {
    await expectRevertCustomError(
      this.instance.upgradeToAndCall(this.implUpgradeNonUUPS.address, '0x'),
      'ERC1967InvalidImplementation',
      [this.implUpgradeNonUUPS.address],
    );
  });

  it('reject proxy address as implementation', async function () {
    const { address } = await ERC1967Proxy.new(this.implInitial.address, '0x');
    const otherInstance = await UUPSUpgradeableMock.at(address);

    await expectRevertCustomError(
      this.instance.upgradeToAndCall(otherInstance.address, '0x'),
      'ERC1967InvalidImplementation',
      [otherInstance.address],
    );
  });
});
