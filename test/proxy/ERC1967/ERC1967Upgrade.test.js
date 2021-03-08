const { expectEvent, expectRevert } = require('@openzeppelin/test-helpers');

const ERC1967Proxy = artifacts.require('ERC1967Proxy');
const ERC1967UpgradeMock = artifacts.require('ERC1967UpgradeMock');
const ERC1967UpgradeSecureMock = artifacts.require('ERC1967UpgradeSecureMock');
const ERC1967UpgradeBrokenMock = artifacts.require('ERC1967UpgradeBrokenMock');

contract('ERC1967Upgrade', function (accounts) {
  before(async function () {
    this.testimpl0 = await ERC1967UpgradeSecureMock.new();
    this.testimpl1 = await ERC1967UpgradeMock.new();
    this.testimpl2 = await ERC1967UpgradeSecureMock.new();
    this.testimpl3 = await ERC1967UpgradeBrokenMock.new();
  });

  describe('Check test-in-prod upgrade securisation', function () {
    beforeEach(async function () {
      const { address } = await ERC1967Proxy.new(this.testimpl0.address, '0x');
      this.instance = await ERC1967UpgradeMock.at(address);
    });

    it('upgrade to basic implementation', async function () {
      const { receipt } = await this.instance.upgradeToAndCall(this.testimpl1.address, '0x');
      // console.log(receipt.logs.filter(({ event }) => event === 'Upgraded').length);
      expectEvent(receipt, 'Upgraded', { implementation: this.testimpl1.address });
    });

    it('upgrade to secure implementation', async function () {
      const { receipt } = await this.instance.upgradeToAndCall(this.testimpl2.address, '0x');
      // console.log(receipt.logs.filter(({ event }) => event === 'Upgraded').length);
      expect(receipt.logs.filter(({ event }) => event === 'Upgraded').length).to.be.equal(1);
      expectEvent(receipt, 'Upgraded', { implementation: this.testimpl2.address });
    });

    it('upgrade to broken implementation', async function () {
      await expectRevert(
        this.instance.upgradeToAndCall(this.testimpl3.address, '0x'),
        'ERC1967Upgrade: upgrade breaks further upgrades',
      );
    });
  });
});
