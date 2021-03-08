const { expectEvent, expectRevert } = require('@openzeppelin/test-helpers');

const ERC1967Proxy = artifacts.require('ERC1967Proxy');
const ERC1967UpgradeTestInProd = artifacts.require('ERC1967UpgradeTestInProd');
const ERC1967UpgradeTestInProdBroken = artifacts.require('ERC1967UpgradeTestInProdBroken');

contract('ERC1967Upgrade', function (accounts) {
  before(async function () {
    this.testimpl1 = await ERC1967UpgradeTestInProd.new();
    this.testimpl2 = await ERC1967UpgradeTestInProd.new();
    this.testimpl3 = await ERC1967UpgradeTestInProdBroken.new();
  });

  describe('Check test-in-prod upgrade securisation', function () {
    beforeEach(async function () {
      const { address } = await ERC1967Proxy.new(this.testimpl1.address, '0x');
      this.instance = await ERC1967UpgradeTestInProd.at(address);
    });

    it('upgrade to working implementation', async function () {
      const { logs } = await this.instance.upgradeToAndCall(this.testimpl2.address, '0x');
      expectEvent.inLogs([ logs[0] ], 'Upgraded', { implementation: this.testimpl2.address });
      expectEvent.inLogs([ logs[1] ], 'Upgraded', { implementation: this.testimpl1.address });
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
