const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');
const { deploy, getFactory } = require('../helpers/deploy');

async function fixture() {
  const accounts = await ethers.getSigners(); // this is slow :/
  const owner    = accounts.shift();
  const other    = accounts.shift();
  const ownable  = await deploy('$Ownable', [ owner.address ]);
  return { accounts, owner, other, ownable };
};

describe('Ownable', function () {
  beforeEach(async function () {
    await loadFixture(fixture).then(results => Object.assign(this, results));
  });

  it('rejects zero address for initialOwner', async function () {
    // checking a custom error requires a contract, or at least the interface
    // we can get it from the contract factory
    const { interface } = await getFactory('$Ownable');

    await expect(deploy('$Ownable', [ ethers.ZeroAddress ]))
    .to.be.revertedWithCustomError({ interface }, 'OwnableInvalidOwner')
    .withArgs(ethers.ZeroAddress);
  });

  it('has an owner', async function () {
    expect(await this.ownable.owner()).to.equal(this.owner.address);
  });

  describe('transfer ownership', function () {
    it('changes owner after transfer', async function () {
      await expect(this.ownable.connect(this.owner).transferOwnership(this.other.address))
      .to.emit(this.ownable, 'OwnershipTransferred')
      .withArgs(this.owner.address, this.other.address);

      expect(await this.ownable.owner()).to.equal(this.other.address);
    });

    it('prevents non-owners from transferring', async function () {
      await expect(this.ownable.connect(this.other).transferOwnership(this.other.address))
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

      await expect(this.ownable.$_transferOwnership(this.other.address))
      .to.emit(this.ownable, 'OwnershipTransferred')
      .withArgs(ethers.ZeroAddress, this.other.address);

      expect(await this.ownable.owner()).to.equal(this.other.address);
    });
  });
});
