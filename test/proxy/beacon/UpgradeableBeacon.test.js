const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

async function fixture() {
  const [owner, other] = await ethers.getSigners();

  const v1 = await ethers.deployContract('Implementation1');
  const beacon = await ethers.deployContract('UpgradeableBeacon', [v1, owner]);

  return { owner, other, beacon, v1 };
}

describe('UpgradeableBeacon', function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  it('cannot be created with non-contract implementation', async function () {
    const UpgradeableBeacon = await ethers.getContractFactory('UpgradeableBeacon');
    await expect(UpgradeableBeacon.deploy(this.other, this.owner))
      .to.be.revertedWithCustomError(UpgradeableBeacon, 'BeaconInvalidImplementation')
      .withArgs(this.other.address);
  });

  describe('once deployed', async function () {
    it('emits Upgraded event to the first implementation', async function () {
      await expect(this.beacon.deploymentTransaction()).to.emit(this.beacon, 'Upgraded').withArgs(this.v1.target);
    });

    it('returns implementation', async function () {
      expect(await this.beacon.implementation()).to.equal(this.v1.target);
    });

    it('can be upgraded by the owner', async function () {
      const v2 = await ethers.deployContract('Implementation2');
      const tx = await this.beacon.connect(this.owner).upgradeTo(v2);
      await expect(tx).to.emit(this.beacon, 'Upgraded').withArgs(v2.target);
      expect(await this.beacon.implementation()).to.equal(v2.target);
    });

    it('cannot be upgraded to a non-contract', async function () {
      await expect(this.beacon.connect(this.owner).upgradeTo(this.other))
        .to.be.revertedWithCustomError(this.beacon, 'BeaconInvalidImplementation')
        .withArgs(this.other.address);
    });

    it('cannot be upgraded by other account', async function () {
      const v2 = await ethers.deployContract('Implementation2');
      await expect(this.beacon.connect(this.other).upgradeTo(v2))
        .to.be.revertedWithCustomError(this.beacon, 'OwnableUnauthorizedAccount')
        .withArgs(this.other.address);
    });
  });
});
