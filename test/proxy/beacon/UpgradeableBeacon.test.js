const { expectRevert, expectEvent } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');

const UpgradeableBeacon = artifacts.require('UpgradeableBeacon');
const Implementation1 = artifacts.require('Implementation1');
const Implementation2 = artifacts.require('Implementation2');

contract('UpgradeableBeacon', function (accounts) {
  const [owner, other] = accounts;

  it('cannot be created with non-contract implementation', async function () {
    await expectRevert(UpgradeableBeacon.new(accounts[0]), 'UpgradeableBeacon: implementation is not a contract');
  });

  context('once deployed', async function () {
    beforeEach('deploying beacon', async function () {
      this.v1 = await Implementation1.new();
      this.beacon = await UpgradeableBeacon.new(this.v1.address, { from: owner });
    });

    it('returns implementation', async function () {
      expect(await this.beacon.implementation()).to.equal(this.v1.address);
    });

    it('can be upgraded by the owner', async function () {
      const v2 = await Implementation2.new();
      const receipt = await this.beacon.upgradeTo(v2.address, { from: owner });
      expectEvent(receipt, 'Upgraded', { implementation: v2.address });
      expect(await this.beacon.implementation()).to.equal(v2.address);
    });

    it('cannot be upgraded to a non-contract', async function () {
      await expectRevert(
        this.beacon.upgradeTo(other, { from: owner }),
        'UpgradeableBeacon: implementation is not a contract',
      );
    });

    it('cannot be upgraded by other account', async function () {
      const v2 = await Implementation2.new();
      await expectRevert(this.beacon.upgradeTo(v2.address, { from: other }), 'Ownable: caller is not the owner');
    });
  });
});
