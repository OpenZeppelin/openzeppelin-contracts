import expectThrow from '../../helpers/expectThrow';
import shouldBehaveLikeMintableToken from './MintableToken.behaviour';
const RBACMintableToken = artifacts.require('RBACMintableToken');

const ROLE_ADMIN = 'admin';
const ROLE_MINTER = 'minter';

contract('RBACMintableToken', function ([admin, anotherAccount, minter]) {
  beforeEach(async function () {
    this.token = await RBACMintableToken.new({ from: admin });
    await this.token.adminAddRole(minter, ROLE_MINTER, { from: admin });
  });

  describe('after token creation', function () {
    it('sender should have the admin role', async function () {
      const hasRole = await this.token.hasRole(admin, ROLE_ADMIN, { from: admin });
      assert.equal(hasRole, true);
    });

    it('admin can add and remove a minter role', async function () {
      await this.token.adminAddRole(minter, ROLE_MINTER, { from: admin });
      let hasRole = await this.token.hasRole(minter, ROLE_MINTER);
      assert.equal(hasRole, true);

      await this.token.adminRemoveRole(minter, ROLE_MINTER, { from: admin });
      hasRole = await this.token.hasRole(minter, ROLE_MINTER);
      assert.equal(hasRole, false);
    });

    it('another account can\'t add or remove a minter role', async function () {
      await expectThrow(
        this.token.adminAddRole(minter, ROLE_MINTER, { from: anotherAccount })
      );

      await this.token.adminAddRole(minter, ROLE_MINTER, { from: admin });
      await expectThrow(
        this.token.adminRemoveRole(minter, ROLE_MINTER, { from: anotherAccount })
      );
    });
  });

  shouldBehaveLikeMintableToken([admin, anotherAccount, minter]);
});
