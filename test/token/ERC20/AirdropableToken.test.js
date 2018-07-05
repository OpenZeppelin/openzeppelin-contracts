import shouldBehaveLikeAirdropableToken from './AirdropableToken.behaviour';
import shouldBehaveLikeMintableToken from './MintableToken.behaviour';

const AirdropableToken = artifacts.require('AirdropableToken');

contract('AirdropableToken', function ([owner, anotherAccount]) {
  const minter = owner;

  beforeEach(async function () {
    this.token = await AirdropableToken.new({ from: owner });
    // await this.token.addMinter(minter, { from: owner });
  });

  shouldBehaveLikeAirdropableToken([owner, anotherAccount, minter]);
  shouldBehaveLikeMintableToken([owner, anotherAccount, minter]);
});
