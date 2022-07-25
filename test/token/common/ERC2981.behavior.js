const { BN, constants, expectRevert } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');
const { ZERO_ADDRESS } = constants;

const { shouldSupportInterfaces } = require('../../utils/introspection/SupportsInterface.behavior');

function shouldBehaveLikeERC2981 () {
  const royaltyFraction = new BN('10');

  shouldSupportInterfaces(['ERC2981']);

  describe('default royalty', function () {
    beforeEach(async function () {
      await this.token.setDefaultRoyalty(this.account1, royaltyFraction);
    });

    it('checks royalty is set', async function () {
      const royalty = new BN((this.salePrice * royaltyFraction) / 10000);

      const initInfo = await this.token.royaltyInfo(this.tokenId1, this.salePrice);

      expect(initInfo[0]).to.be.equal(this.account1);
      expect(initInfo[1]).to.be.bignumber.equal(royalty);
    });

    it('updates royalty amount', async function () {
      const newPercentage = new BN('25');

      // Updated royalty check
      await this.token.setDefaultRoyalty(this.account1, newPercentage);
      const royalty = new BN((this.salePrice * newPercentage) / 10000);
      const newInfo = await this.token.royaltyInfo(this.tokenId1, this.salePrice);

      expect(newInfo[0]).to.be.equal(this.account1);
      expect(newInfo[1]).to.be.bignumber.equal(royalty);
    });

    it('holds same royalty value for different tokens', async function () {
      const newPercentage = new BN('20');
      await this.token.setDefaultRoyalty(this.account1, newPercentage);

      const token1Info = await this.token.royaltyInfo(this.tokenId1, this.salePrice);
      const token2Info = await this.token.royaltyInfo(this.tokenId2, this.salePrice);

      expect(token1Info[1]).to.be.bignumber.equal(token2Info[1]);
    });

    it('Remove royalty information', async function () {
      const newValue = new BN('0');
      await this.token.deleteDefaultRoyalty();

      const token1Info = await this.token.royaltyInfo(this.tokenId1, this.salePrice);
      const token2Info = await this.token.royaltyInfo(this.tokenId2, this.salePrice);
      // Test royalty info is still persistent across all tokens
      expect(token1Info[0]).to.be.bignumber.equal(token2Info[0]);
      expect(token1Info[1]).to.be.bignumber.equal(token2Info[1]);
      // Test information was deleted
      expect(token1Info[0]).to.be.equal(ZERO_ADDRESS);
      expect(token1Info[1]).to.be.bignumber.equal(newValue);
    });

    it('reverts if invalid parameters', async function () {
      await expectRevert(
        this.token.setDefaultRoyalty(ZERO_ADDRESS, royaltyFraction),
        'ERC2981: invalid receiver',
      );

      await expectRevert(
        this.token.setDefaultRoyalty(this.account1, new BN('11000')),
        'ERC2981: royalty fee will exceed salePrice',
      );
    });
  });

  describe('token based royalty', function () {
    beforeEach(async function () {
      await this.token.setTokenRoyalty(this.tokenId1, this.account1, royaltyFraction);
    });

    it('updates royalty amount', async function () {
      const newPercentage = new BN('25');
      let royalty = new BN((this.salePrice * royaltyFraction) / 10000);
      // Initial royalty check
      const initInfo = await this.token.royaltyInfo(this.tokenId1, this.salePrice);

      expect(initInfo[0]).to.be.equal(this.account1);
      expect(initInfo[1]).to.be.bignumber.equal(royalty);

      // Updated royalty check
      await this.token.setTokenRoyalty(this.tokenId1, this.account1, newPercentage);
      royalty = new BN((this.salePrice * newPercentage) / 10000);
      const newInfo = await this.token.royaltyInfo(this.tokenId1, this.salePrice);

      expect(newInfo[0]).to.be.equal(this.account1);
      expect(newInfo[1]).to.be.bignumber.equal(royalty);
    });

    it('holds different values for different tokens', async function () {
      const newPercentage = new BN('20');
      await this.token.setTokenRoyalty(this.tokenId2, this.account1, newPercentage);

      const token1Info = await this.token.royaltyInfo(this.tokenId1, this.salePrice);
      const token2Info = await this.token.royaltyInfo(this.tokenId2, this.salePrice);

      // must be different even at the same this.salePrice
      expect(token1Info[1]).to.not.be.equal(token2Info.royaltyFraction);
    });

    it('reverts if invalid parameters', async function () {
      await expectRevert(
        this.token.setTokenRoyalty(this.tokenId1, ZERO_ADDRESS, royaltyFraction),
        'ERC2981: Invalid parameters',
      );

      await expectRevert(
        this.token.setTokenRoyalty(this.tokenId1, this.account1, new BN('11000')),
        'ERC2981: royalty fee will exceed salePrice',
      );
    });

    it('can reset token after setting royalty', async function () {
      const newPercentage = new BN('30');
      const royalty = new BN((this.salePrice * newPercentage) / 10000);
      await this.token.setTokenRoyalty(this.tokenId1, this.account2, newPercentage);

      const tokenInfo = await this.token.royaltyInfo(this.tokenId1, this.salePrice);

      // Tokens must have own information
      expect(tokenInfo[1]).to.be.bignumber.equal(royalty);
      expect(tokenInfo[0]).to.be.equal(this.account2);

      await this.token.setTokenRoyalty(this.tokenId2, this.account1, new BN('0'));
      const result = await this.token.royaltyInfo(this.tokenId2, this.salePrice);
      // Token must not share default information
      expect(result[0]).to.be.equal(this.account1);
      expect(result[1]).to.be.bignumber.equal(new BN('0'));
    });

    it('can hold default and token royalty information', async function () {
      const newPercentage = new BN('30');
      const royalty = new BN((this.salePrice * newPercentage) / 10000);

      await this.token.setTokenRoyalty(this.tokenId2, this.account2, newPercentage);

      const token1Info = await this.token.royaltyInfo(this.tokenId1, this.salePrice);
      const token2Info = await this.token.royaltyInfo(this.tokenId2, this.salePrice);
      // Tokens must not have same values
      expect(token1Info[1]).to.not.be.bignumber.equal(token2Info[1]);
      expect(token1Info[0]).to.not.be.equal(token2Info[0]);

      // Updated token must have new values
      expect(token2Info[0]).to.be.equal(this.account2);
      expect(token2Info[1]).to.be.bignumber.equal(royalty);
    });
  });
}

module.exports = {
  shouldBehaveLikeERC2981,
};
