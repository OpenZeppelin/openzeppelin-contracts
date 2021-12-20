const { BN, constants } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');
const { ZERO_ADDRESS } = constants;

const { shouldBehaveLikeERC2981 } = require('../../common/ERC2981.behavior');

const ERC1155RoyaltyMock = artifacts.require('ERC1155RoyaltyMock');

contract('ERC1155Royalty', function (accounts) {
  const [ account1, account2 ] = accounts;
  const uri = 'https://token.com';
  const tokenId1 = new BN('1');
  const tokenId2 = new BN('2');
  const royalty = new BN('200');
  const salePrice = new BN('1000');
  const firstTokenAmount = new BN('42');
  const secondTokenAmount = new BN('23');

  beforeEach(async function () {
    this.token = await ERC1155RoyaltyMock.new(uri);

    await this.token.mint(account1, tokenId1, firstTokenAmount, '0x');
    await this.token.mint(account1, tokenId2, secondTokenAmount, '0x');
    this.account1 = account1;
    this.account2 = account2;
    this.tokenId1 = tokenId1;
    this.tokenId2 = tokenId2;
    this.salePrice = salePrice;
  });

  describe('token specific functions', function () {
    beforeEach(async function () {
      await this.token.setTokenRoyalty(tokenId1, account1, royalty);
    });

    it('keeps royalty information after burning single token for id', async function () {
      await this.token.burn(account1, tokenId1, new BN('1'));
      const tokenInfo = await this.token.royaltyInfo(tokenId1, salePrice);
      const result = new BN((this.salePrice * royalty) / 10000);
      expect(tokenInfo[0]).to.be.equal(account1);
      expect(tokenInfo[1]).to.be.bignumber.equal(result);
    });

    it('removes royalty information after burning all tokens for id', async function () {
      await this.token.burn(account1, tokenId1, firstTokenAmount);
      const tokenInfo = await this.token.royaltyInfo(tokenId1, salePrice);

      expect(tokenInfo[0]).to.be.equal(ZERO_ADDRESS);
      expect(tokenInfo[1]).to.be.bignumber.equal(new BN('0'));
    });
  });

  shouldBehaveLikeERC2981();
});
