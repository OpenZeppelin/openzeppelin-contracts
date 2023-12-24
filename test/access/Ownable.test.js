const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

async function fixture() {
  const [owner, other] = await ethers.getSigners();
  const ownable = await ethers.deployContract('$Ownable', [owner]);
  return { owner, other, ownable };
}

describe('Ownable', function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  it('emits ownership transfer events during construction', async function () {
    await expect(this.ownable.deploymentTransaction())
      .to.emit(this.ownable, 'OwnershipTransferred')
      .withArgs(ethers.ZeroAddress, this.owner.address);
  });

  it('rejects zero address for initialOwner', async function () {
    await expect(ethers.deployContract('$Ownable', [ethers.ZeroAddress]))
      .to.be.revertedWithCustomError({ interface: this.ownable.interface }, 'OwnableInvalidOwner')
      .withArgs(ethers.ZeroAddress);
  });

  it('has an owner', async function () {
    expect(await this.ownable.owner()).to.equal(this.owner.address);
  });

  describe('transfer ownership', function () {
    it('changes owner after transfer', async function () {
      await expect(this.ownable.connect(this.owner).transferOwnership(this.other))
        .to.emit(this.ownable, 'OwnershipTransferred')
        .withArgs(this.owner.address, this.other.address);

      expect(await this.ownable.owner()).to.equal(this.other.address);
    });

    it('prevents non-owners from transferring', async function () {
      await expect(this.ownable.connect(this.other).transferOwnership(this.other))
        .to.be.revertedWithCustomError(this.ownable, 'OwnableUnauthorizedAccount')
        .withArgs(this.other.address);
    });

    it('guards ownership against stuck state', async function () {
      await expect(this.ownable.connect(this.owner).transferOwnership(ethers.ZeroAddress))
        .to.be.revertedWithCustomError(this.ownable, 'OwnableInvalidOwner')
        .withArgs(ethers.ZeroAddress);
    });
  });

  describe('renounce ownership', function () {
    it('loses ownership after renouncement', async function () {
      await expect(this.ownable.connect(this.owner).renounceOwnership())
        .to.emit(this.ownable, 'OwnershipTransferred')
        .withArgs(this.owner.address, ethers.ZeroAddress);

      expect(await this.ownable.owner()).to.equal(ethers.ZeroAddress);
    });

    it('prevents non-owners from renouncement', async function () {
      await expect(this.ownable.connect(this.other).renounceOwnership())
        .to.be.revertedWithCustomError(this.ownable, 'OwnableUnauthorizedAccount')
        .withArgs(this.other.address);
    });

    it('allows to recover access using the internal _transferOwnership', async function () {
      await this.ownable.connect(this.owner).renounceOwnership();

      await expect(this.ownable.$_transferOwnership(this.other))
        .to.emit(this.ownable, 'OwnershipTransferred')
        .withArgs(ethers.ZeroAddress, this.other.address);

      expect(await this.ownable.owner()).to.equal(this.other.address);
    });
  });
});
