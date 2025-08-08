const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');
const { shouldBehaveLikeERC173 } = require('./ERC173.behavior');

async function fixture() {
  const [owner, other] = await ethers.getSigners();
  const mock = await ethers.deployContract('$OwnableRenounceable', [owner]);
  return { owner, other, mock };
}

describe('OwnableRenounceable', function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  describe('ERC173', function () {
    shouldBehaveLikeERC173();
  });

  it('emits ownership transfer events during construction', async function () {
    await expect(this.mock.deploymentTransaction())
      .to.emit(this.mock, 'OwnershipTransferred')
      .withArgs(ethers.ZeroAddress, this.owner);
  });

  it('rejects zero address for initialOwner', async function () {
    await expect(ethers.deployContract('$Ownable', [ethers.ZeroAddress]))
      .to.be.revertedWithCustomError({ interface: this.mock.interface }, 'OwnableInvalidOwner')
      .withArgs(ethers.ZeroAddress);
  });

  it('guards ownership against stuck state', async function () {
    await expect(this.mock.connect(this.owner).transferOwnership(ethers.ZeroAddress))
      .to.be.revertedWithCustomError(this.mock, 'OwnableInvalidOwner')
      .withArgs(ethers.ZeroAddress);
  });

  describe('renounce ownership', function () {
    it('loses ownership after renouncement', async function () {
      await expect(this.mock.connect(this.owner).renounceOwnership())
        .to.emit(this.mock, 'OwnershipTransferred')
        .withArgs(this.owner, ethers.ZeroAddress);

      await expect(this.mock.owner()).to.eventually.equal(ethers.ZeroAddress);
    });

    it('prevents non-owners from renouncement', async function () {
      await expect(this.mock.connect(this.other).renounceOwnership())
        .to.be.revertedWithCustomError(this.mock, 'OwnableUnauthorizedAccount')
        .withArgs(this.other);
    });

    it('allows to recover access using the internal _transferOwnership', async function () {
      await this.mock.connect(this.owner).renounceOwnership();

      await expect(this.mock.$_transferOwnership(this.other))
        .to.emit(this.mock, 'OwnershipTransferred')
        .withArgs(ethers.ZeroAddress, this.other);

      await expect(this.mock.owner()).to.eventually.equal(this.other);
    });
  });
});
