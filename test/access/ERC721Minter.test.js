
import assertRevert from '../helpers/assertRevert';
import { getBouncerSigner } from '../helpers/sign';

const ERC721Minter = artifacts.require('ERC721Minter');
const MintableERC721Token = artifacts.require('MintableERC721TokenImpl');

const TOKEN_URI = 'https://example.com';
const INCORRECT_TOKEN_URI = 'https://incorrect.example.com';
const tokenId = new web3.BigNumber(0);
const incorrectTokenId = new web3.BigNumber(1);

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(web3.BigNumber))
  .should();

contract('ERC721Minter', ([_, owner, user, anyone, bouncerAddress]) => {
  before(async function () {
    this.token = await MintableERC721Token.new('Test Token', 'TEST', { from: owner });
    this.minter = await ERC721Minter.new(this.token.address, { from: owner });
    this.signFor = getBouncerSigner(this.minter, bouncerAddress);
    await this.token.addMinter(this.minter.address, { from: owner });
    await this.minter.addBouncer(bouncerAddress, { from: owner });
  });

  context('invalid signature', function () {
    it('should not allow anyone to mint tokens', async function () {
      await assertRevert(
        this.minter.mint('0x0', tokenId, TOKEN_URI, { from: anyone })
      );
    });

    it('should not allow user to mint with the wrong tokenURI', async function () {
      await assertRevert(
        this.minter.mint(
          tokenId,
          INCORRECT_TOKEN_URI,
          this.signFor(user, 'mint', [tokenId, TOKEN_URI]),
          { from: user }
        )
      );
    });

    it('should not allow user to mint with the wrong tokenId', async function () {
      await assertRevert(
        this.minter.mint(
          incorrectTokenId,
          TOKEN_URI,
          this.signFor(user, 'mint', [tokenId, TOKEN_URI]),
          { from: user }
        )
      );
    });
  });

  context('valid signature', function () {
    it('should allow user to mint', async function () {
      ;
      await this.minter.mint(
        tokenId,
        TOKEN_URI,
        this.signFor(user, 'mint', [tokenId, TOKEN_URI]),
        { from: user }
      );

      const balance = await this.token.balanceOf(user);
      balance.should.be.bignumber.eq(1);

      const newTokenId = await this.token.tokenOfOwnerByIndex(user, 0);
      newTokenId.should.be.bignumber.eq(tokenId);
    });
  });
});
