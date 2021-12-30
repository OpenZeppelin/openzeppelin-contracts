const { expectEvent, expectRevert } = require('@openzeppelin/test-helpers');
const { web3 } = require('@openzeppelin/test-helpers/src/setup');
const { ImplementationSlot, toChecksumAddress } = require('../../helpers/erc1967');

const ERC1967Proxy = artifacts.require('ERC1967Proxy');
const UUPSUpgradeableMock = artifacts.require('UUPSUpgradeableMock');
const UUPSUpgradeableUnsafeMock = artifacts.require('UUPSUpgradeableUnsafeMock');
const UUPSUpgradeableBrokenMock = artifacts.require('UUPSUpgradeableBrokenMock');
const CountersImpl = artifacts.require('CountersImpl');

const Legacy = [ 'UUPSLegacyV1' ].map(artifacts.require);

contract('UUPSUpgradeable', function (accounts) {
  before(async function () {
    this.implInitial = await UUPSUpgradeableMock.new();
    this.implUpgradeOk = await UUPSUpgradeableMock.new();
    this.implUpgradeUnsafe = await UUPSUpgradeableUnsafeMock.new();
    this.implUpgradeBroken = await UUPSUpgradeableBrokenMock.new();
    this.implUpgradeNonUUPS = await CountersImpl.new();
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

  it.skip('reject upgrade to broken upgradeable implementation (no longer supported)', async function () {
    await expectRevert(
      this.instance.upgradeTo(this.implUpgradeBroken.address),
      'ERC1967Upgrade: upgrade breaks further upgrades',
    );
  });

  // delegate to a non existing upgradeTo function causes a low level revert
  it('reject upgrade to non uups implementation', async function () {
    await expectRevert.unspecified(
      this.instance.upgradeTo(this.implUpgradeNonUUPS.address),
    );
  });

  it('reject proxy address as implementation', async function () {
    const { address } = await ERC1967Proxy.new(this.implInitial.address, '0x');
    const otherInstance = await UUPSUpgradeableMock.at(address);

    // infinite loop reverts when a nested call is out-of-gas
    await expectRevert(
      this.instance.upgradeTo(otherInstance.address),
      'Function must not be called through delegatecall',
    );
  });

  describe('compatibility with legacy version of UUPSUpgradeable', function () {
    for (const artefact of Legacy) {
      it(`can upgrade from ${artefact._json.contractName}`, async function () {
        const legacyImpl = await artefact.new();
        const legacyInstance = await ERC1967Proxy.new(legacyImpl.address, '0x')
          .then(({ address }) => artefact.at(address));

        const receipt = await legacyInstance.upgradeTo(this.implInitial.address);

        const UpgradedEvents = receipt.logs.filter(({ address, event }) =>
          address === legacyInstance.address &&
          event === 'Upgraded',
        );
        expect(UpgradedEvents.length).to.be.equal(1);

        expectEvent(receipt, 'Upgraded', { implementation: this.implInitial.address });

        const implementationSlot = await web3.eth.getStorageAt(legacyInstance.address, ImplementationSlot);
        const implementationAddress = toChecksumAddress(implementationSlot.substr(-40));
        expect(implementationAddress).to.be.equal(this.implInitial.address);
      });
    };
  });
});
