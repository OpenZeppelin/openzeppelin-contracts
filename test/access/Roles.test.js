const shouldFail = require('../helpers/shouldFail');
const { ZERO_ADDRESS } = require('../helpers/constants');

const RolesMock = artifacts.require('RolesMock');

require('./../helpers/setup');

contract('Roles', function ([_, authorized, otherAuthorized, anyone]) {
  beforeEach(async function () {
    this.roles = await RolesMock.new();
  });

  it('reverts when querying roles for the null account', async function () {
    await shouldFail.reverting(this.roles.has(ZERO_ADDRESS));
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

      it('reverts when adding roles to an already assigned account', async function () {
        await this.roles.add(authorized);
        await shouldFail.reverting(this.roles.add(authorized));
      });

      it('reverts when adding roles to the null account', async function () {
        await shouldFail.reverting(this.roles.add(ZERO_ADDRESS));
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

      it('reverts when removing unassigned roles', async function () {
        await shouldFail.reverting(this.roles.remove(anyone));
      });

      it('reverts when removing roles from the null account', async function () {
        await shouldFail.reverting(this.roles.remove(ZERO_ADDRESS));
      });
    });
  });
});
