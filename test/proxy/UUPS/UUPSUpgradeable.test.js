const { expectEvent, expectRevert } = require('@openzeppelin/test-helpers');

const ERC1967Proxy = artifacts.require('ERC1967Proxy');
const UUPSUpgradeableMock = artifacts.require('UUPSUpgradeableMock');
const UUPSUpgradeableUnsafeMock = artifacts.require('UUPSUpgradeableUnsafeMock');
const UUPSUpgradeableBrokenMock = artifacts.require('UUPSUpgradeableBrokenMock');

contract('UUPSUpgradeable', function (accounts) {
  before(async function () {
    this.implInitial = await UUPSUpgradeableMock.new();
    this.implUpgradeOk = await UUPSUpgradeableMock.new();
    this.implUpgradeUnsafe = await UUPSUpgradeableUnsafeMock.new();
    this.implUpgradeBroken = await UUPSUpgradeableBrokenMock.new();
  });

  describe('Check test-in-prod upgrade securisation', function () {
    beforeEach(async function () {
      const { address } = await ERC1967Proxy.new(this.implInitial.address, '0x');
      this.instance = await UUPSUpgradeableMock.at(address);
    });

    it('upgrade to proxiable implementation', async function () {
      const { receipt } = await this.instance.upgradeTo(this.implUpgradeOk.address);
      // console.log(receipt.logs.filter(({ event }) => event === 'Upgraded').length);
      expect(receipt.logs.filter(({ event }) => event === 'Upgraded').length).to.be.equal(1);
      expectEvent(receipt, 'Upgraded', { implementation: this.implUpgradeOk.address });
    });

    it('upgrade to proxiable implementation with call', async function () {
      expect(await this.instance.current()).to.be.bignumber.equal('0');

      const { receipt } = await this.instance.upgradeToAndCall(
        this.implUpgradeOk.address,
        this.implUpgradeOk.contract.methods.increment().encodeABI(),
      );
      // console.log(receipt.logs.filter(({ event }) => event === 'Upgraded').length);
      expect(receipt.logs.filter(({ event }) => event === 'Upgraded').length).to.be.equal(1);
      expectEvent(receipt, 'Upgraded', { implementation: this.implUpgradeOk.address });

      expect(await this.instance.current()).to.be.bignumber.equal('1');
    });

    it('upgrade to and unsafe proxiable implementation', async function () {
      const { receipt } = await this.instance.upgradeTo(this.implUpgradeUnsafe.address);
      // console.log(receipt.logs.filter(({ event }) => event === 'Upgraded').length);
      expectEvent(receipt, 'Upgraded', { implementation: this.implUpgradeUnsafe.address });
    });

    it('upgrade to broken proxiable implementation', async function () {
      await expectRevert(
        this.instance.upgradeTo(this.implUpgradeBroken.address),
        'ERC1967Upgrade: upgrade breaks further upgrades',
      );
    });

    it('use proxy address as implementation', async function () {
      const { address } = await ERC1967Proxy.new(this.implInitial.address, '0x');
      const otherInstance = await UUPSUpgradeableMock.at(address);

      // infinite loop reverts when a nested call is out-of-gas
      await expectRevert(
        this.instance.upgradeTo(otherInstance.address),
        'Address: low-level delegate call failed',
      );
    });
  });
});
