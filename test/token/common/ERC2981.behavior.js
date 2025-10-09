const { ethers } = require('hardhat');
const { expect } = require('chai');

const { shouldSupportInterfaces } = require('../../utils/introspection/SupportsInterface.behavior');

function shouldBehaveLikeERC2981() {
  const royaltyFraction = 10n;

  shouldSupportInterfaces(['ERC2981']);

  describe('default royalty', function () {
    beforeEach(async function () {
      await this.token.$_setDefaultRoyalty(this.account1, royaltyFraction);
    });

    it('checks royalty is set', async function () {
      expect(await this.token.royaltyInfo(this.tokenId1, this.salePrice)).to.deep.equal([
        this.account1.address,
        (this.salePrice * royaltyFraction) / 10_000n,
      ]);
    });

    it('updates royalty amount', async function () {
      const newFraction = 25n;

      await this.token.$_setDefaultRoyalty(this.account1, newFraction);

      expect(await this.token.royaltyInfo(this.tokenId1, this.salePrice)).to.deep.equal([
        this.account1.address,
        (this.salePrice * newFraction) / 10_000n,
      ]);
    });

    it('holds same royalty value for different tokens', async function () {
      const newFraction = 20n;

      await this.token.$_setDefaultRoyalty(this.account1, newFraction);

      expect(await this.token.royaltyInfo(this.tokenId1, this.salePrice)).to.deep.equal(
        await this.token.royaltyInfo(this.tokenId2, this.salePrice),
      );
    });

    it('Remove royalty information', async function () {
      const newValue = 0n;
      await this.token.$_deleteDefaultRoyalty();

      expect(await this.token.royaltyInfo(this.tokenId1, this.salePrice)).to.deep.equal([ethers.ZeroAddress, newValue]);

      expect(await this.token.royaltyInfo(this.tokenId2, this.salePrice)).to.deep.equal([ethers.ZeroAddress, newValue]);
    });

    it('reverts if invalid parameters', async function () {
      const royaltyDenominator = await this.token.$_feeDenominator();

      await expect(this.token.$_setDefaultRoyalty(ethers.ZeroAddress, royaltyFraction))
        .to.be.revertedWithCustomError(this.token, 'ERC2981InvalidDefaultRoyaltyReceiver')
        .withArgs(ethers.ZeroAddress);

      const anotherRoyaltyFraction = 11000n;

      await expect(this.token.$_setDefaultRoyalty(this.account1, anotherRoyaltyFraction))
        .to.be.revertedWithCustomError(this.token, 'ERC2981InvalidDefaultRoyalty')
        .withArgs(anotherRoyaltyFraction, royaltyDenominator);
    });
  });

  describe('token based royalty', function () {
    beforeEach(async function () {
      await this.token.$_setTokenRoyalty(this.tokenId1, this.account1, royaltyFraction);
    });

    it('updates royalty amount', async function () {
      const newFraction = 25n;

      expect(await this.token.royaltyInfo(this.tokenId1, this.salePrice)).to.deep.equal([
        this.account1.address,
        (this.salePrice * royaltyFraction) / 10_000n,
      ]);

      await this.token.$_setTokenRoyalty(this.tokenId1, this.account1, newFraction);

      expect(await this.token.royaltyInfo(this.tokenId1, this.salePrice)).to.deep.equal([
        this.account1.address,
        (this.salePrice * newFraction) / 10_000n,
      ]);
    });

    it('holds different values for different tokens', async function () {
      const newFraction = 20n;

      await this.token.$_setTokenRoyalty(this.tokenId2, this.account1, newFraction);

      expect(await this.token.royaltyInfo(this.tokenId1, this.salePrice)).to.not.deep.equal(
        await this.token.royaltyInfo(this.tokenId2, this.salePrice),
      );
    });

    it('reverts if invalid parameters', async function () {
      const royaltyDenominator = await this.token.$_feeDenominator();

      await expect(this.token.$_setTokenRoyalty(this.tokenId1, ethers.ZeroAddress, royaltyFraction))
        .to.be.revertedWithCustomError(this.token, 'ERC2981InvalidTokenRoyaltyReceiver')
        .withArgs(this.tokenId1, ethers.ZeroAddress);

      const anotherRoyaltyFraction = 11000n;

      await expect(this.token.$_setTokenRoyalty(this.tokenId1, this.account1, anotherRoyaltyFraction))
        .to.be.revertedWithCustomError(this.token, 'ERC2981InvalidTokenRoyalty')
        .withArgs(this.tokenId1, anotherRoyaltyFraction, royaltyDenominator);
    });

    it('can reset token after setting royalty', async function () {
      const newFraction = 30n;

      await this.token.$_setTokenRoyalty(this.tokenId1, this.account2, newFraction);

      // Tokens must have own information
      expect(await this.token.royaltyInfo(this.tokenId1, this.salePrice)).to.deep.equal([
        this.account2.address,
        (this.salePrice * newFraction) / 10_000n,
      ]);

      await this.token.$_setTokenRoyalty(this.tokenId2, this.account1, 0n);

      // Token must not share default information
      expect(await this.token.royaltyInfo(this.tokenId2, this.salePrice)).to.deep.equal([this.account1.address, 0n]);
    });

    it('can hold default and token royalty information', async function () {
      const newFraction = 30n;

      await this.token.$_setTokenRoyalty(this.tokenId2, this.account2, newFraction);

      // Tokens must not have same values
      expect(await this.token.royaltyInfo(this.tokenId1, this.salePrice)).to.not.deep.equal([
        this.account2.address,
        (this.salePrice * newFraction) / 10_000n,
      ]);

      // Updated token must have new values
      expect(await this.token.royaltyInfo(this.tokenId2, this.salePrice)).to.deep.equal([
        this.account2.address,
        (this.salePrice * newFraction) / 10_000n,
      ]);
    });
  });
}

module.exports = {
  shouldBehaveLikeERC2981,
};
