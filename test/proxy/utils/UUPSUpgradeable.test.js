const { expectEvent, expectRevert } = require('@openzeppelin/test-helpers');
const { web3 } = require('@openzeppelin/test-helpers/src/setup');
const { getSlot, ImplementationSlot } = require('../../helpers/erc1967');

const ERC1967Proxy = artifacts.require('ERC1967Proxy');
const UUPSUpgradeableMock = artifacts.require('UUPSUpgradeableMock');
const UUPSUpgradeableUnsafeMock = artifacts.require('UUPSUpgradeableUnsafeMock');
const UUPSUpgradeableLegacyMock = artifacts.require('UUPSUpgradeableLegacyMock');
const NonUpgradeableMock = artifacts.require('NonUpgradeableMock');

contract('UUPSUpgradeable', function () {
  before(async function () {
    this.implInitial = await UUPSUpgradeableMock.new();
    this.implUpgradeOk = await UUPSUpgradeableMock.new();
    this.implUpgradeUnsafe = await UUPSUpgradeableUnsafeMock.new();
    this.implUpgradeNonUUPS = await NonUpgradeableMock.new();
  });

  beforeEach(async function () {
    const { address } = await ERC1967Proxy.new(this.implInitial.address, '0x');
    this.instance = await UUPSUpgradeableMock.at(address);
  });

  it('upgrade to upgradeable implementation', async function () {
    const { receipt } = await this.instance.upgradeTo(this.implUpgradeOk.address);
    expect(receipt.logs.filter(({ event }) => event === 'Upgraded').length).to.be.equal(1);
    expectEvent(receipt, 'Upgraded', { implementation: this.implUpgradeOk.address });
  });

  it('upgrade to upgradeable implementation with call', async function () {
    expect(await this.instance.current()).to.be.bignumber.equal('0');

    const { receipt } = await this.instance.upgradeToAndCall(
      this.implUpgradeOk.address,
      this.implUpgradeOk.contract.methods.increment().encodeABI(),
    );
    expect(receipt.logs.filter(({ event }) => event === 'Upgraded').length).to.be.equal(1);
    expectEvent(receipt, 'Upgraded', { implementation: this.implUpgradeOk.address });

    expect(await this.instance.current()).to.be.bignumber.equal('1');
  });

  it('upgrade to and unsafe upgradeable implementation', async function () {
    const { receipt } = await this.instance.upgradeTo(this.implUpgradeUnsafe.address);
    expectEvent(receipt, 'Upgraded', { implementation: this.implUpgradeUnsafe.address });
  });

  // delegate to a non existing upgradeTo function causes a low level revert
  it('reject upgrade to non uups implementation', async function () {
    await expectRevert(
      this.instance.upgradeTo(this.implUpgradeNonUUPS.address),
      'ERC1967Upgrade: new implementation is not UUPS',
    );
  });

  it('reject proxy address as implementation', async function () {
    const { address } = await ERC1967Proxy.new(this.implInitial.address, '0x');
    const otherInstance = await UUPSUpgradeableMock.at(address);

    await expectRevert(
      this.instance.upgradeTo(otherInstance.address),
      'ERC1967Upgrade: new implementation is not UUPS',
    );
  });

  it('can upgrade from legacy implementations', async function () {
    const legacyImpl = await UUPSUpgradeableLegacyMock.new();
    const legacyInstance = await ERC1967Proxy.new(legacyImpl.address, '0x').then(({ address }) =>
      UUPSUpgradeableLegacyMock.at(address),
    );

    const receipt = await legacyInstance.upgradeTo(this.implInitial.address);

    const UpgradedEvents = receipt.logs.filter(
      ({ address, event }) => address === legacyInstance.address && event === 'Upgraded',
    );
    expect(UpgradedEvents.length).to.be.equal(1);

    expectEvent(receipt, 'Upgraded', { implementation: this.implInitial.address });

    const implementationSlot = await getSlot(legacyInstance, ImplementationSlot);
    const implementationAddress = web3.utils.toChecksumAddress(implementationSlot.substr(-40));
    expect(implementationAddress).to.be.equal(this.implInitial.address);
  });
});
