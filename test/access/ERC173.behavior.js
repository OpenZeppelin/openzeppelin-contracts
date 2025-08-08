const { ethers } = require('hardhat');
const { expect } = require('chai');

const { shouldSupportInterfaces } = require('../utils/introspection/SupportsInterface.behavior');

function shouldBehaveLikeERC173() {
  shouldSupportInterfaces(['ERC173']);

  it('has an owner', async function () {
    await expect(this.mock.owner()).to.eventually.equal(this.owner);
  });

  describe('transfer ownership', function () {
    it('changes owner after transfer', async function () {
      await expect(this.mock.connect(this.owner).transferOwnership(this.other))
        .to.emit(this.mock, 'OwnershipTransferred')
        .withArgs(this.owner, this.other);

      await expect(this.mock.owner()).to.eventually.equal(this.other);
    });

    it('prevents non-owners from transferring', async function () {
      await expect(this.mock.connect(this.other).transferOwnership(this.other))
        .to.be.revertedWithCustomError(this.mock, 'OwnableUnauthorizedAccount')
        .withArgs(this.other);
    });

    it('allows transferring to the same owner', async function () {
      await expect(this.mock.connect(this.owner).transferOwnership(this.owner))
        .to.emit(this.mock, 'OwnershipTransferred')
        .withArgs(this.owner, this.owner);
      await expect(this.mock.owner()).to.eventually.equal(this.owner);
    });

    it('allows transferring to zero address (renouncing ownership)', async function () {
      await expect(this.mock.connect(this.owner).$_transferOwnership(ethers.ZeroAddress))
        .to.emit(this.mock, 'OwnershipTransferred')
        .withArgs(this.owner, ethers.ZeroAddress);
      await expect(this.mock.owner()).to.eventually.equal(ethers.ZeroAddress);
    });
  });

  describe('owner check', function () {
    it('allows owner to call protected functions', async function () {
      await expect(this.mock.connect(this.owner).$_checkOwner()).to.not.be.reverted;
    });

    it('prevents non-owner from calling protected functions', async function () {
      await expect(this.mock.connect(this.other).$_checkOwner())
        .to.be.revertedWithCustomError(this.mock, 'OwnableUnauthorizedAccount')
        .withArgs(this.other);
    });
  });
}

module.exports = {
  shouldBehaveLikeERC173,
};
