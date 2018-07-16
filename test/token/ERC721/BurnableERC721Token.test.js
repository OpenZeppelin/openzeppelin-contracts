import shouldBehaveLikeBurnableERC721Token from './ERC721Burnable.behaviour';
const BurnableERC721Token = artifacts.require('BurnableERC721TokenMock');

contract('BurnableERC721Token', function ([creator, beneficiary, anotherAccount]) {
  const minter = creator;

  beforeEach(async function () {
    this.token = await BurnableERC721Token.new({ from: creator });
  });

  shouldBehaveLikeBurnableERC721Token([minter, beneficiary, anotherAccount]);
});
