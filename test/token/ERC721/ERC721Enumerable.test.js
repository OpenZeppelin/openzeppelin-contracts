const { ethers } = require('hardhat');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');
const {
  shouldBehaveLikeERC721,
  shouldBehaveLikeERC721Metadata,
  shouldBehaveLikeERC721Enumerable,
} = require('./ERC721.behavior');

async function fixture() {
  const [owner, newOwner, approved, anotherApproved, operator, other] = await ethers.getSigners();

  const name = 'Non Fungible Token';
  const symbol = 'NFT';

  const token = await ethers.deployContract('$ERC721Enumerable', [name, symbol]);

  return { owner, newOwner, approved, anotherApproved, operator, other, name, symbol, token };
}

describe.only('ERC721Enumerable', function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  shouldBehaveLikeERC721();
  shouldBehaveLikeERC721Metadata();
  shouldBehaveLikeERC721Enumerable();
});
