const { BN, constants, expectRevert } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');
const { ZERO_ADDRESS } = constants;

const { shouldSupportInterfaces } = require('../../../utils/introspection/SupportsInterface.behavior');

const ERC721RoyaltyMock = artifacts.require('ERC721RoyaltyMock');

contract('ERC721Royalty', function (accounts) {
  const [ account1, account2 ] = accounts;
  const tokenId1 = new BN('1');
  const tokenId2 = new BN('2');
  const salePrice = new BN('1000');
  const royaltyFraction = new BN('10');

  beforeEach(async function () {
    this.token = await ERC721RoyaltyMock.new('My Token', 'TKN');

    await this.token.mint(account1, tokenId1);
    await this.token.mint(account1, tokenId2);
  });

  it('calls supports interface', async function () {
    const result = await this.token.supportsInterface('0x2a55205a');
    const expected = true;

    expect(result).to.not.equal(undefined);
    expect(result).to.equal(expected);
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

    it('can hold global and token royalty information', async function () {
      const newPercentage = new BN('30');
      const royalty = new BN((salePrice * newPercentage) / 10000);

      await this.token.setTokenRoyalty(tokenId2, account2, newPercentage);

      const token1Info = await this.token.royaltyInfo(tokenId1, salePrice);
      const token2Info = await this.token.royaltyInfo(tokenId2, salePrice);
      // Tokens must not have same values
      expect(token1Info[1]).to.not.be.bignumber.equal(token2Info[1]);
      expect(token1Info[0]).to.not.be.equal(token2Info[0]);

      // Updated token must have new values
      expect(token2Info[0]).to.be.equal(account2);
      expect(token2Info[1]).to.be.bignumber.equal(royalty);
    });

    it('can reset token after setting royalty', async function () {
      const newPercentage = new BN('30');
      let royalty = new BN((salePrice * newPercentage) / 10000);
      await this.token.setTokenRoyalty(tokenId1, account2, newPercentage);

      const tokenInfo = await this.token.royaltyInfo(tokenId1, salePrice);

      // Tokens must have own information
      expect(tokenInfo[1]).to.be.bignumber.equal(royalty);
      expect(tokenInfo[0]).to.be.equal(account2);

      await this.token.setTokenRoyalty(tokenId2, account1, new BN('0'));
      const result = await this.token.royaltyInfo(tokenId2, salePrice);
      // Token must not share global information
      expect(result[0]).to.be.equal(account1);
      expect(result[1]).to.be.bignumber.equal(new BN('0'));
    });

    it('Remove royalty information', async function () {
      const newValue = new BN('0');
      await this.token.deleteRoyalty();

      const token1Info = await this.token.royaltyInfo(tokenId1, salePrice);
      const token2Info = await this.token.royaltyInfo(tokenId2, salePrice);
      // Test royalty info is still persistent across all tokens
      expect(token1Info[0]).to.be.bignumber.equal(token2Info[0]);
      expect(token1Info[1]).to.be.bignumber.equal(token2Info[1]);
      // Test information was deleted
      expect(token1Info[0]).to.be.equal(ZERO_ADDRESS);
      expect(token1Info[1]).to.be.bignumber.equal(newValue);
    });

    it('reverts if invalid parameters', async function () {
      await expectRevert(
        this.token.setGlobalRoyalty(ZERO_ADDRESS, royaltyFraction),
        'ERC2981: Invalid receiver',
      );

      await expectRevert(
        this.token.setTokenRoyalty(tokenId1, account1, new BN('11000')),
        'ERC2981: Royalty percentage will exceed salePrice',
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
        'ERC2981: Invalid parameters',
      );

      await expectRevert(
        this.token.setTokenRoyalty(tokenId1, account1, new BN('11000')),
        'ERC2981: Royalty percentage will exceed salePrice',
      );

      await expectRevert(
        this.token.setTokenRoyalty(new BN('787'), account1, new BN('100')),
        'ERC2981: Nonexistent token',
      );
    });

    it('removes royalty information after burn', async function () {
      await this.token.burn(tokenId1);
      const tokenInfo = await this.token.royaltyInfo(tokenId1, salePrice);

      expect(tokenInfo[0]).to.be.equal(ZERO_ADDRESS);
      expect(tokenInfo[1]).to.be.bignumber.equal(new BN('0'));

      await expectRevert(
        this.token.setTokenRoyalty(tokenId1, account1, new BN('100')),
        'ERC2981: Nonexistent token',
      );
    });
  });
});
