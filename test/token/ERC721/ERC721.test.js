const { ethers } = require('hardhat');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

const { shouldBehaveLikeERC721, shouldBehaveLikeERC721Metadata } = require('./ERC721.behavior');

async function fixture() {
  const [owner, newOwner, approved, anotherApproved, operator, other] = await ethers.getSigners();

  const name = 'Non Fungible Token';
  const symbol = 'NFT';
  const token = await ethers.deployContract('$ERC721', [name, symbol]);

  return { owner, newOwner, approved, anotherApproved, operator, other, token, name, symbol };
}

describe.only('ERC721', function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  shouldBehaveLikeERC721();
  shouldBehaveLikeERC721Metadata();
});
