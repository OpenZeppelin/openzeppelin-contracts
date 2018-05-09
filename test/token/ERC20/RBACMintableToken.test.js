import expectThrow from '../../helpers/expectThrow';
import shouldBehaveLikeMintableToken from './MintableToken.behaviour';
const RBACMintableToken = artifacts.require('RBACMintableToken');

const ROLE_MINTER = 'minter';

contract('RBACMintableToken', function ([owner, anotherAccount, minter]) {
  beforeEach(async function () {
    this.token = await RBACMintableToken.new({ from: owner });
    await this.token.addMinter(minter, { from: owner });
  });

  describe('handle roles', function () {
    it('owner can add and remove a minter role', async function () {
      await this.token.addMinter(anotherAccount, { from: owner });
      let hasRole = await this.token.hasRole(anotherAccount, ROLE_MINTER);
      assert.equal(hasRole, true);

      await this.token.removeMinter(anotherAccount, { from: owner });
      hasRole = await this.token.hasRole(anotherAccount, ROLE_MINTER);
      assert.equal(hasRole, false);
    });

    it('another account can\'t add or remove a minter role', async function () {
      await expectThrow(
        this.token.addMinter(anotherAccount, { from: anotherAccount })
      );

      await this.token.addMinter(anotherAccount, { from: owner });
      await expectThrow(
        this.token.removeMinter(anotherAccount, { from: anotherAccount })
      );
    });
  });

  shouldBehaveLikeMintableToken([owner, anotherAccount, minter]);
});
