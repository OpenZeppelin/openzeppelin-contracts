const { BN, constants, expectRevert } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');
const { ZERO_ADDRESS } = constants;

const { shouldSupportInterfaces } = require('../../../utils/introspection/SupportsInterface.behavior');

const ERC721RoyaltyMock = artifacts.require('ERC721RoyaltyMock');

contract('ERC721Royalty', function (accounts) {
  const [ account1 ] = accounts;
  const tokenId1 = new BN('1');
  const tokenId2 = new BN('2');
  const salePrice = new BN('1000');
  const royaltyFraction = new BN('10');

  beforeEach(async function () {
    this.token = await ERC721RoyaltyMock.new();
  });

  shouldSupportInterfaces(['ERC2981']);

  describe('global royalty', function () {
    beforeEach(async function () {
      await this.token.setGlobalRoyalty (account1, royaltyFraction);
    });

    it('updates royalty amount', async function () {
      const newAmount = new BN('25');
      let royalty = new BN((salePrice * royaltyFraction) / 100);
      // Initial royalty check
      const initInfo = await this.token.royaltyInfo(tokenId1, salePrice);

      expect(initInfo.receiver).to.be.equal(account1);
      expect(initInfo.royaltyFraction).to.be.bignumber.equal(royalty);

      // Updated royalty check
      await this.token.setGlobalRoyalty (account1, newAmount);
      royalty = new BN((salePrice * newAmount) / 100);
      const newInfo = await this.token.royaltyInfo(tokenId1, salePrice);

      expect(newInfo.receiver).to.be.equal(account1);
      expect(newInfo.royaltyFraction).to.be.bignumber.equal(royalty);
    });

    it('holds same royalty value for different tokens', async function () {
      const newAmount = new BN('20');
      await this.token.setGlobalRoyalty (account1, newAmount);

      const token1Info = await this.token.royaltyInfo(tokenId1, salePrice);
      const token2Info = await this.token.royaltyInfo(tokenId2, salePrice);

      expect(token1Info.royaltyFraction).to.be.bignumber.equal(token2Info.royaltyFraction);
    });

    it('reverts if invalid parameters', async function () {
      await expectRevert(
        this.token.setGlobalRoyalty (ZERO_ADDRESS, royaltyFraction),
        'ERC2981: Invalid receiver',
      );

      await expectRevert(
        this.token.setGlobalRoyalty (account1, new BN('100')),
        'ERC2981: Royalty percentage is too high',
      );
    });
  });

  describe('token based royalty', function () {
    beforeEach(async function () {
      await this.token.setTokenRoyalty(tokenId1, account1, royaltyFraction);
    });

    it('updates royalty amount', async function () {
      const newAmount = new BN('25');
      let royalty = new BN((salePrice * royaltyFraction) / 100);
      // Initial royalty check
      const initInfo = await this.token.royaltyInfo(tokenId1, salePrice);

      expect(initInfo.receiver).to.be.equal(account1);
      expect(initInfo.royaltyFraction).to.be.bignumber.equal(royalty);

      // Updated royalty check
      await this.token.setTokenRoyalty(tokenId1, account1, newAmount);
      royalty = new BN((salePrice * newAmount) / 100);
      const newInfo = await this.token.royaltyInfo(tokenId1, salePrice);

      expect(newInfo.receiver).to.be.equal(account1);
      expect(newInfo.royaltyFraction).to.be.bignumber.equal(royalty);
    });

    it('holds different values for different tokens', async function () {
      const newAmount = new BN('20');
      await this.token.setTokenRoyalty(tokenId2, account1, newAmount);

      const token1Info = await this.token.royaltyInfo(tokenId1, salePrice);
      const token2Info = await this.token.royaltyInfo(tokenId2, salePrice);

      // must be different even at the same SalePrice
      expect(token1Info.royaltyFraction).to.not.be.equal(token2Info.royaltyFraction);
    });

    it('reverts if invalid parameters', async function () {
      await expectRevert(
        this.token.setTokenRoyalty(tokenId1, ZERO_ADDRESS, royaltyFraction),
        'ERC2981: Invalid receiver',
      );

      await expectRevert(
        this.token.setTokenRoyalty(tokenId1, account1, new BN('100')),
        'ERC2981: Royalty percentage is too high',
      );
    });
  });
});
