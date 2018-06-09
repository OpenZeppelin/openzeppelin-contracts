const MintableERC721Token = artifacts.require('DefaultTokenURIMock');

const NO_TOKEN_URI = '';
const DEFAULT_TOKEN_URI = 'https://default.example.com';
const SPECIFIC_TOKEN_URI = 'https://specific.example.com';

const tokenId = new web3.BigNumber(0);

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(web3.BigNumber))
  .should();

contract('DefaultTokenURI', ([_, owner, minter]) => {
  beforeEach(async function () {
    this.token = await MintableERC721Token.new(
      'Test Token',
      'TEST',
      DEFAULT_TOKEN_URI,
      { from: owner }
    );
    await this.token.addMinter(minter, { from: owner });
  });

  context('when token has no specific URI', function () {
    it('should return default uri', async function () {
      await this.token.mint(owner, tokenId, NO_TOKEN_URI, { from: minter });
      const balance = await this.token.balanceOf(owner);
      balance.should.be.bignumber.eq(1);

      const tokenURI = await this.token.tokenURI(tokenId);
      tokenURI.should.not.eq(NO_TOKEN_URI);
      tokenURI.should.eq(DEFAULT_TOKEN_URI);
    });
  });

  context('with specific URI', function () {
    it('should return specific URI', async function () {
      await this.token.mint(owner, tokenId, SPECIFIC_TOKEN_URI, { from: minter });
      const balance = await this.token.balanceOf(owner);
      balance.should.be.bignumber.eq(1);

      const tokenURI = await this.token.tokenURI(tokenId);
      tokenURI.should.not.eq(DEFAULT_TOKEN_URI);
      tokenURI.should.eq(SPECIFIC_TOKEN_URI);
    });
  });
});
