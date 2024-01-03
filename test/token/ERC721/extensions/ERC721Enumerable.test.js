const { ethers } = require('hardhat');
const { expect } = require('chai');
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

  shouldBehaveLikeERC721({
    different: function (tokenId) {
      it('adjusts owners tokens by index', async function () {
        expect(await this.token.tokenOfOwnerByIndex(this.to, 0n)).to.equal(tokenId);
        expect(await this.token.tokenOfOwnerByIndex(this.owner, 0n)).to.not.equal(tokenId);
      });
    },
    same: function (ids) {
      it('keeps same tokens by index', async function () {
        for (const index in ids) expect(await this.token.tokenOfOwnerByIndex(this.owner, index)).to.equal(ids[index]);
      });
    },
  });
  shouldBehaveLikeERC721Metadata(name, symbol);
  shouldBehaveLikeERC721Enumerable();
});
