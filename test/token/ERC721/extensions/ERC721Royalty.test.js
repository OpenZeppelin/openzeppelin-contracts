require('@openzeppelin/test-helpers');

const { shouldBehaveLikeERC2981 } = require('../../common/ERC2981.behavior');

const ERC721Royalty = artifacts.require('$ERC721Royalty');

contract('ERC721Royalty', function (accounts) {
  const [account1, account2, recipient] = accounts;
  const tokenId1 = web3.utils.toBN('1');
  const tokenId2 = web3.utils.toBN('2');
  const royalty = web3.utils.toBN('200');
  const salePrice = web3.utils.toBN('1000');

  beforeEach(async function () {
    this.token = await ERC721Royalty.new('My Token', 'TKN');

    await this.token.$_mint(account1, tokenId1);
    await this.token.$_mint(account1, tokenId2);
    this.account1 = account1;
    this.account2 = account2;
    this.tokenId1 = tokenId1;
    this.tokenId2 = tokenId2;
    this.salePrice = salePrice;
  });

  describe('token specific functions', function () {
    beforeEach(async function () {
      await this.token.$_setTokenRoyalty(tokenId1, recipient, royalty);
    });

    it('royalty information are kept during burn and re-mint', async function () {
      await this.token.$_burn(tokenId1);

      const tokenInfoA = await this.token.royaltyInfo(tokenId1, salePrice);
      expect(tokenInfoA[0]).to.be.equal(recipient);
      expect(tokenInfoA[1]).to.be.bignumber.equal(salePrice.mul(royalty).divn(1e4));

      await this.token.$_mint(account2, tokenId1);

      const tokenInfoB = await this.token.royaltyInfo(tokenId1, salePrice);
      expect(tokenInfoB[0]).to.be.equal(recipient);
      expect(tokenInfoB[1]).to.be.bignumber.equal(salePrice.mul(royalty).divn(1e4));
    });
  });

  shouldBehaveLikeERC2981();
});
