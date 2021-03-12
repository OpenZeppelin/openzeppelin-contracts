const { expectEvent, expectRevert } = require('@openzeppelin/test-helpers');

const ERC1967Proxy = artifacts.require('ERC1967Proxy');
const ProxiableMock = artifacts.require('ProxiableMock');
const ProxiableUnsafeMock = artifacts.require('ProxiableUnsafeMock');
const ProxiableBrokenMock = artifacts.require('ProxiableBrokenMock');

contract('ERC1967Upgrade', function (accounts) {
  before(async function () {
    this.testimpl0 = await ProxiableMock.new();
    this.testimpl1 = await ProxiableMock.new();
    this.testimpl2 = await ProxiableUnsafeMock.new();
    this.testimpl3 = await ProxiableBrokenMock.new();
  });

  describe('Check test-in-prod upgrade securisation', function () {
    beforeEach(async function () {
      const { address } = await ERC1967Proxy.new(this.testimpl0.address, '0x');
      this.instance = await ProxiableMock.at(address);
    });

    it('upgrade to proxiable implementation', async function () {
      const { receipt } = await this.instance.upgradeToAndCall(this.testimpl1.address, '0x');
      // console.log(receipt.logs.filter(({ event }) => event === 'Upgraded').length);
      expect(receipt.logs.filter(({ event }) => event === 'Upgraded').length).to.be.equal(1);
      expectEvent(receipt, 'Upgraded', { implementation: this.testimpl1.address });
    });

    it('upgrade to and unsafe proxiable implementation', async function () {
      const { receipt } = await this.instance.upgradeToAndCall(this.testimpl2.address, '0x');
      // console.log(receipt.logs.filter(({ event }) => event === 'Upgraded').length);
      expectEvent(receipt, 'Upgraded', { implementation: this.testimpl2.address });
    });

    it('upgrade to broken proxiable implementation', async function () {
      await expectRevert(
        this.instance.upgradeToAndCall(this.testimpl3.address, '0x'),
        'ERC1967Upgrade: upgrade breaks further upgrades',
      );
    });
  });
});
