const { assertRevert } = require('../../helpers/assertRevert');

const RolesMock = artifacts.require('RolesMock');

require('chai')
  .should();

contract('Roles', function ([_, authorized, otherAuthorized, anyone]) {
  const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

  beforeEach(async function () {
    this.roles = await RolesMock.new();
    this.testRole = async (account, expected) => {
      if (expected) {
        (await this.roles.has(account)).should.equal(true);
        await this.roles.check(account); // this call shouldn't revert, but is otherwise a no-op
      } else {
        (await this.roles.has(account)).should.equal(false);
        await assertRevert(this.roles.check(account));
      }
    };
  });

  context('initially', function () {
    it('doesn\'t pre-assign roles', async function () {
      await this.testRole(authorized, false);
      await this.testRole(otherAuthorized, false);
      await this.testRole(anyone, false);
    });

    describe('adding roles', function () {
      it('adds roles to a single account', async function () {
        await this.roles.add(authorized);
        await this.testRole(authorized, true);
        await this.testRole(anyone, false);
      });

      it('adds roles to an already-assigned account', async function () {
        await this.roles.add(authorized);
        await this.roles.add(authorized);
        await this.testRole(authorized, true);
      });

      it('adds roles to multiple accounts', async function () {
        await this.roles.addMany([authorized, otherAuthorized]);
        await this.testRole(authorized, true);
        await this.testRole(otherAuthorized, true);
      });

      it('adds roles to multiple identical accounts', async function () {
        await this.roles.addMany([authorized, authorized]);
        await this.testRole(authorized, true);
      });

      it('doesn\'t revert when adding roles to the null account', async function () {
        await this.roles.add(ZERO_ADDRESS);
      });
    });
  });

  context('with added roles', function () {
    beforeEach(async function () {
      await this.roles.addMany([authorized, otherAuthorized]);
    });

    describe('removing roles', function () {
      it('removes a single role', async function () {
        await this.roles.remove(authorized);
        await this.testRole(authorized, false);
        await this.testRole(otherAuthorized, true);
      });

      it('doesn\'t revert when removing unassigned roles', async function () {
        await this.roles.remove(anyone);
      });

      it('doesn\'t revert when removing roles from the null account', async function () {
        await this.roles.remove(ZERO_ADDRESS);
      });
    });

    describe('transfering roles', function () {
      context('from account with role', function () {
        const from = authorized;

        it('transfers to other account with no role', async function () {
          await this.roles.transfer(anyone, { from });
          await this.testRole(anyone, true);
          await this.testRole(authorized, false);
        });

        it('reverts when transfering to an account with role', async function () {
          await assertRevert(this.roles.transfer(otherAuthorized, { from }));
        });

        it('reverts when transfering to the null account', async function () {
          await assertRevert(this.roles.transfer(ZERO_ADDRESS, { from }));
        });
      });

      context('from account without role', function () {
        const from = anyone;

        it('reverts', async function () {
          await assertRevert(this.roles.transfer(authorized, { from }));
        });
      });
    });

    describe('renouncing roles', function () {
      it('renounces an assigned role', async function () {
        await this.roles.renounce({ from: authorized });
        await this.testRole(authorized, false);
      });

      it('doesn\'t revert when renouncing unassigned role', async function () {
        await this.roles.renounce({ from: anyone });
      });
    });
  });
});
