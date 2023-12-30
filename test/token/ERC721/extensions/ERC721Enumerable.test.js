const { ethers } = require('hardhat');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

const {
  shouldBehaveLikeERC721,
  shouldBehaveLikeERC721Metadata,
  shouldBehaveLikeERC721Enumerable,
} = require('../ERC721.behavior');

const name = 'Non Fungible Token';
const symbol = 'NFT';

async function fixture() {
  const [owner, newOwner, approved, operator, other] = await ethers.getSigners();
  return {
    owner,
    newOwner,
    approved,
    operator,
    other,
    token: await ethers.deployContract('$ERC721Enumerable', [name, symbol]),
  };
}

describe('ERC721Enumerable', function () {
  beforeEach(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  shouldBehaveLikeERC721();
  shouldBehaveLikeERC721Metadata(name, symbol);
  shouldBehaveLikeERC721Enumerable();
});
