const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

const { shouldBehaveLikeERC2981 } = require('../../common/ERC2981.behavior');

const name = 'Non Fungible Token';
const symbol = 'NFT';

const tokenId1 = 1n;
const tokenId2 = 2n;
const royalty = 200n;
const salePrice = 1000n;

async function fixture() {
  const [account1, account2, recipient] = await ethers.getSigners();

  const token = await ethers.deployContract('$ERC721Royalty', [name, symbol]);
  await token.$_mint(account1, tokenId1);
  await token.$_mint(account1, tokenId2);

  return { account1, account2, recipient, token };
}

describe('ERC721Royalty', function () {
  beforeEach(async function () {
    Object.assign(
      this,
      await loadFixture(fixture),
      { tokenId1, tokenId2, royalty, salePrice }, // set for behavior tests
    );
  });

  describe('token specific functions', function () {
    beforeEach(async function () {
      await this.token.$_setTokenRoyalty(tokenId1, this.recipient, royalty);
    });

    it('royalty information are kept during burn and re-mint', async function () {
      await this.token.$_burn(tokenId1);

      expect(await this.token.royaltyInfo(tokenId1, salePrice)).to.deep.equal([
        this.recipient.address,
        (salePrice * royalty) / 10000n,
      ]);

      await this.token.$_mint(this.account2, tokenId1);

      expect(await this.token.royaltyInfo(tokenId1, salePrice)).to.deep.equal([
        this.recipient.address,
        (salePrice * royalty) / 10000n,
      ]);
    });
  });

  shouldBehaveLikeERC2981();
});
