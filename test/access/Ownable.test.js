const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');
const { shouldBehaveLikeERC173 } = require('./ERC173.behavior');

async function fixture() {
  const [owner, other] = await ethers.getSigners();
  const mock = await ethers.deployContract('$Ownable', [owner]);
  return { owner, other, mock };
}

describe('Ownable', function () {
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
});
