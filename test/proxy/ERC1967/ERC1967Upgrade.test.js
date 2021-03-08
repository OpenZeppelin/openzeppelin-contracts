const { expectEvent, expectRevert } = require('@openzeppelin/test-helpers');

const ERC1967Proxy = artifacts.require('ERC1967Proxy');
const ERC1967UpgradeMock = artifacts.require('ERC1967UpgradeMock');
const ERC1967UpgradeTestInProdMock = artifacts.require('ERC1967UpgradeTestInProdMock');
const ERC1967UpgradeTestInProdBrokenMock = artifacts.require('ERC1967UpgradeTestInProdBrokenMock');

contract('ERC1967Upgrade', function (accounts) {
  before(async function () {
    this.testimpl0 = await ERC1967UpgradeTestInProdMock.new();
    this.testimpl1 = await ERC1967UpgradeMock.new();
    this.testimpl2 = await ERC1967UpgradeTestInProdMock.new();
    this.testimpl3 = await ERC1967UpgradeTestInProdBrokenMock.new();
  });

  describe('Check test-in-prod upgrade securisation', function () {
    beforeEach(async function () {
      const { address } = await ERC1967Proxy.new(this.testimpl0.address, '0x');
      this.instance = await ERC1967UpgradeMock.at(address);
    });

    it('upgrade to basic implementation', async function () {
      const { logs } = await this.instance.upgradeToAndCall(this.testimpl1.address, '0x');
      expectEvent.inLogs([ logs[0] ], 'Upgraded', { implementation: this.testimpl1.address });
      expectEvent.inLogs([ logs[1] ], 'Upgraded', { implementation: this.testimpl0.address });
      expectEvent.inLogs([ logs[2] ], 'Upgraded', { implementation: this.testimpl1.address });
    });

    it('upgrade to secure implementation', async function () {
      const { logs } = await this.instance.upgradeToAndCall(this.testimpl2.address, '0x');
      expectEvent.inLogs([ logs[0] ], 'Upgraded', { implementation: this.testimpl2.address });
      expectEvent.inLogs([ logs[1] ], 'Upgraded', { implementation: this.testimpl0.address });
      expectEvent.inLogs([ logs[2] ], 'Upgraded', { implementation: this.testimpl2.address });
    });

    it('upgrade to broken implementation', async function () {
      await expectRevert(
        this.instance.upgradeToAndCall(this.testimpl3.address, '0x'),
        'ERC1967Upgrade: upgrade breaks further upgrades',
      );
    });
  });
});
