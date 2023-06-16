const { expectEvent } = require('@openzeppelin/test-helpers');
const { expectRevertCustomError } = require('../../helpers/customError');

const ERC1967Proxy = artifacts.require('ERC1967Proxy');
const UUPSUpgradeableMock = artifacts.require('UUPSUpgradeableMock');
const UUPSUpgradeableUnsafeMock = artifacts.require('UUPSUpgradeableUnsafeMock');
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
    await expectRevertCustomError(
      this.instance.upgradeTo(this.implUpgradeNonUUPS.address),
      'ERC1967InvalidImplementation',
      [this.implUpgradeNonUUPS.address],
    );
  });

  it('reject proxy address as implementation', async function () {
    const { address } = await ERC1967Proxy.new(this.implInitial.address, '0x');
    const otherInstance = await UUPSUpgradeableMock.at(address);

    await expectRevertCustomError(this.instance.upgradeTo(otherInstance.address), 'ERC1967InvalidImplementation', [
      otherInstance.address,
    ]);
  });
});
