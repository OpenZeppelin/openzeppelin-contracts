import shouldBehaveLikeERC721BasicToken from './ERC721BasicToken.behaviour';
import shouldBehaveLikeERC721Token from './ERC721Token.behaviour';
import shouldBehaveLikeMintableERC721Token from './ERC721Mint.behaviour';
import shouldBehaveLikeBurnableERC721Token from './ERC721Burn.behaviour';

const BigNumber = web3.BigNumber;
const ERC721Token = artifacts.require('ERC721TokenMock.sol');

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

contract('ERC721Token', function (accounts) {
  const creator = accounts[0];

  beforeEach(async function () {
    this.name = 'Non Fungible Token';
    this.symbol = 'NFT';
    this.token = await ERC721Token.new(this.name, this.symbol, { from: creator });
  });

  shouldBehaveLikeERC721BasicToken(accounts);
  shouldBehaveLikeERC721Token(accounts);
  shouldBehaveLikeMintableERC721Token(accounts[0], accounts[1]);
  shouldBehaveLikeBurnableERC721Token(accounts[0], accounts[1], accounts[2]);
});
