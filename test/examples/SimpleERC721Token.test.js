import shouldBehaveLikeERC721BasicToken from '../token/ERC721/ERC721BasicToken.behaviour';
import shouldBehaveLikeERC721Token from '../token/ERC721/ERC721Token.behaviour';
import shouldBehaveLikeMintableERC721Token from '../token/ERC721/ERC721Mint.behaviour';
import shouldBehaveLikeBurnableERC721Token from '../token/ERC721/ERC721Burn.behaviour';
import assertRevert from '../helpers/assertRevert';

const BigNumber = web3.BigNumber;
const SimpleERC721Token = artifacts.require('SimpleERC721Token.sol');

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

contract('SimpleERC721Token', function (accounts) {
  const creator = accounts[0];
  const beneficiary = accounts[1];
  const anotherAccount = accounts[2];

  beforeEach(async function () {
    this.name = 'Simple Non Fungible Token';
    this.symbol = 'SNFT';
    this.token = await SimpleERC721Token.new(this.name, this.symbol, { from: creator });
  });

  shouldBehaveLikeERC721BasicToken(accounts);
  shouldBehaveLikeERC721Token(accounts);
  shouldBehaveLikeMintableERC721Token([creator, beneficiary]);
  shouldBehaveLikeBurnableERC721Token([creator, beneficiary, anotherAccount]);

  context('like a BurnableERC721Token', function () {
    const minter = creator;
    const tokenId = 1;

    beforeEach(async function () {
      await this.token.mint(beneficiary, tokenId, { from: minter });
    });

    describe('when sender is not token owner', function () {
      it('reverts', async function () {
        await assertRevert(this.token.burn(tokenId, { from: anotherAccount }));
      });
    });
  });
});
