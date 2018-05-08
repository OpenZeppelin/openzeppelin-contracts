import shouldBehaveLikeMintableToken from './MintableToken.behaviour';
const MintableToken = artifacts.require('MintableToken');

contract('Mintable', function ([owner, anotherAccount]) {
  const minter = owner;

  beforeEach(async function () {
    this.token = await MintableToken.new({ from: owner });
  });

  describe('after token creation', function () {
    it('sender should be token owner', async function () {
      const tokenOwner = await this.token.owner({ from: owner });
      tokenOwner.should.equal(owner);
    });
  });

  shouldBehaveLikeMintableToken([owner, anotherAccount, minter]);
});
