const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

async function fixture() {
  const [admin, other] = await ethers.getSigners();

  const v1 = await ethers.deployContract('Implementation1');
  const v2 = await ethers.deployContract('Implementation2');
  const beacon = await ethers.deployContract('UpgradeableBeacon', [v1, admin]);

  return { admin, other, beacon, v1, v2 };
}

describe('UpgradeableBeacon', function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  it('cannot be created with non-contract implementation', async function () {
    await expect(ethers.deployContract('UpgradeableBeacon', [this.other, this.admin]))
      .to.be.revertedWithCustomError(this.beacon, 'BeaconInvalidImplementation')
      .withArgs(this.other);
  });

  describe('once deployed', function () {
    it('emits Upgraded event to the first implementation', async function () {
      await expect(this.beacon.deploymentTransaction()).to.emit(this.beacon, 'Upgraded').withArgs(this.v1);
    });

    it('returns implementation', async function () {
      expect(await this.beacon.implementation()).to.equal(this.v1);
    });

    it('can be upgraded by the admin', async function () {
      await expect(this.beacon.connect(this.admin).upgradeTo(this.v2))
        .to.emit(this.beacon, 'Upgraded')
        .withArgs(this.v2);

      expect(await this.beacon.implementation()).to.equal(this.v2);
    });

    it('cannot be upgraded to a non-contract', async function () {
      await expect(this.beacon.connect(this.admin).upgradeTo(this.other))
        .to.be.revertedWithCustomError(this.beacon, 'BeaconInvalidImplementation')
        .withArgs(this.other);
    });

    it('cannot be upgraded by other account', async function () {
      await expect(this.beacon.connect(this.other).upgradeTo(this.v2))
        .to.be.revertedWithCustomError(this.beacon, 'OwnableUnauthorizedAccount')
        .withArgs(this.other);
    });
  });
});
