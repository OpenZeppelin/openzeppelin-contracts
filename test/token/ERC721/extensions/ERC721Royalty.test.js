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
      await this.token.setGlobalRoyalty(account1, royaltyFraction);
    });

    it('updates royalty amount', async function () {
      const newPercentage = new BN('25');
      let royalty = new BN((salePrice * royaltyFraction) / 10000);
      // Initial royalty check
      const initInfo = await this.token.royaltyInfo(tokenId1, salePrice);

      expect(initInfo[0]).to.be.equal(account1);
      expect(initInfo[1]).to.be.bignumber.equal(royalty);

      // Updated royalty check
      await this.token.setGlobalRoyalty(account1, newPercentage);
      royalty = new BN((salePrice * newPercentage) / 10000);
      const newInfo = await this.token.royaltyInfo(tokenId1, salePrice);

      expect(newInfo[0]).to.be.equal(account1);
      expect(newInfo[1]).to.be.bignumber.equal(royalty);
    });

    it('holds same royalty value for different tokens', async function () {
      const newPercentage = new BN('20');
      await this.token.setGlobalRoyalty(account1, newPercentage);

      const token1Info = await this.token.royaltyInfo(tokenId1, salePrice);
      const token2Info = await this.token.royaltyInfo(tokenId2, salePrice);

      expect(token1Info[1]).to.be.bignumber.equal(token2Info[1]);
    });

    it('reverts if invalid parameters', async function () {
      await expectRevert(
        this.token.setGlobalRoyalty(ZERO_ADDRESS, royaltyFraction),
        'ERC2981: Invalid receiver',
      );

      await expectRevert(
        this.token.setGlobalRoyalty(account1, new BN('100')),
        'ERC2981: Royalty percentage is too high',
      );
    });
  });

  describe('token based royalty', function () {
    beforeEach(async function () {
      await this.token.setTokenRoyalty(tokenId1, account1, royaltyFraction);
    });

    it('updates royalty amount', async function () {
      const newPercentage = new BN('25');
      let royalty = new BN((salePrice * royaltyFraction) / 10000);
      // Initial royalty check
      const initInfo = await this.token.royaltyInfo(tokenId1, salePrice);

      expect(initInfo[0]).to.be.equal(account1);
      expect(initInfo[1]).to.be.bignumber.equal(royalty);

      // Updated royalty check
      await this.token.setTokenRoyalty(tokenId1, account1, newPercentage);
      royalty = new BN((salePrice * newPercentage) / 10000);
      const newInfo = await this.token.royaltyInfo(tokenId1, salePrice);

      expect(newInfo[0]).to.be.equal(account1);
      expect(newInfo[1]).to.be.bignumber.equal(royalty);
    });

    it('holds different values for different tokens', async function () {
      const newPercentage = new BN('20');
      await this.token.setTokenRoyalty(tokenId2, account1, newPercentage);

      const token1Info = await this.token.royaltyInfo(tokenId1, salePrice);
      const token2Info = await this.token.royaltyInfo(tokenId2, salePrice);

      // must be different even at the same SalePrice
      expect(token1Info[1]).to.not.be.equal(token2Info.royaltyFraction);
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
