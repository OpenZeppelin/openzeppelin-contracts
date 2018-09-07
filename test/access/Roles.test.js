const { assertRevert } = require('../helpers/assertRevert');

const RolesMock = artifacts.require('RolesMock');

require('chai')
  .should();

contract('Roles', function ([_, authorized, otherAuthorized, anyone]) {
  const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

  beforeEach(async function () {
    this.roles = await RolesMock.new();
  });

  it('reverts when querying roles for the null account', async function () {
    await assertRevert(this.roles.has(ZERO_ADDRESS));
  });

  context('initially', function () {
    it('doesn\'t pre-assign roles', async function () {
      (await this.roles.has(authorized)).should.equal(false);
      (await this.roles.has(otherAuthorized)).should.equal(false);
      (await this.roles.has(anyone)).should.equal(false);
    });

    describe('adding roles', function () {
      it('adds roles to a single account', async function () {
        await this.roles.add(authorized);
        (await this.roles.has(authorized)).should.equal(true);
        (await this.roles.has(anyone)).should.equal(false);
      });

      it('adds roles to an already-assigned account', async function () {
        await this.roles.add(authorized);
        await this.roles.add(authorized);
        (await this.roles.has(authorized)).should.equal(true);
      });

      it('reverts when adding roles to the null account', async function () {
        await assertRevert(this.roles.add(ZERO_ADDRESS));
      });
    });
  });

  context('with added roles', function () {
    beforeEach(async function () {
      await this.roles.add(authorized);
      await this.roles.add(otherAuthorized);
    });

    describe('removing roles', function () {
      it('removes a single role', async function () {
        await this.roles.remove(authorized);
        (await this.roles.has(authorized)).should.equal(false);
        (await this.roles.has(otherAuthorized)).should.equal(true);
      });

      it('doesn\'t revert when removing unassigned roles', async function () {
        await this.roles.remove(anyone);
      });

      it('reverts when removing roles from the null account', async function () {
        await assertRevert(this.roles.remove(ZERO_ADDRESS));
      });
    });
  });
});
