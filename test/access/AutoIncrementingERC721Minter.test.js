
import { getBouncerSigner } from '../helpers/sign';

const AutoIncrementingERC721Minter = artifacts.require('AutoIncrementingERC721Minter');
const MintableERC721Token = artifacts.require('MintableERC721TokenImpl');

const TOKEN_URI = 'https://example.com';

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(web3.BigNumber))
  .should();

contract('AutoIncrementingERC721Minter', ([_, owner, user, bouncerAddress]) => {
  before(async function () {
    this.token = await MintableERC721Token.new('Test Token', 'TEST', { from: owner });
    this.minter = await AutoIncrementingERC721Minter.new(this.token.address, { from: owner });
    this.signFor = getBouncerSigner(this.minter, bouncerAddress);
    await this.token.addMinter(this.minter.address, { from: owner });
    await this.minter.addBouncer(bouncerAddress, { from: owner });
  });

  for (let id = 0; id < 3; id++) {
    it(`should assign the user tokenId ${id}`, async function () {
      await this.minter.mint(
        TOKEN_URI,
        this.signFor(user, 'mint', [TOKEN_URI]),
        { from: user }
      );

      const balance = await this.token.balanceOf(user);
      balance.should.be.bignumber.eq(id + 1);

      const tokenId = await this.token.tokenOfOwnerByIndex(user, id);
      tokenId.should.be.bignumber.eq(tokenId);
    });
  }
});
