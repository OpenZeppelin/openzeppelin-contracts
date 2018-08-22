const { assertRevert } = require('../../helpers/assertRevert');
const expectEvent = require('../../helpers/expectEvent');

const RolesMock = artifacts.require('RolesMock');

require('chai')
  .should();

contract('Roles', function ([_, authorized, otherAuthorized, anyone]) {
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

      it('removes unassigned roles', async function () {
        await this.roles.remove(anyone);
      });
    });
  });
});
