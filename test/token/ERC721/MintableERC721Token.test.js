import shouldBehaveLikeMintableERC721Token from './MintableERC721Token.behaviour';
const MintableERC721Token = artifacts.require('MintableERC721Token');

contract('MintableERC721Token', function ([owner, beneficiary, anotherAccount]) {
  const name = 'Non Fungible Token';
  const symbol = 'NFT';
  const minter = owner;

  beforeEach(async function () {
    this.token = await MintableERC721Token.new(name, symbol, { from: owner });
  });

  shouldBehaveLikeMintableERC721Token([owner, minter, beneficiary, anotherAccount]);
});
