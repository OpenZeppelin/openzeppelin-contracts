const { accounts, contract } = require('@openzeppelin/test-environment');

const { expectRevert, constants } = require('@openzeppelin/test-helpers');
const { ZERO_ADDRESS } = constants;

const { expect } = require('chai');

const RolesMock = contract.fromArtifact('RolesMock');

describe('Roles', function () {
  const [ authorized, otherAuthorized, other ] = accounts;

  beforeEach(async function () {
    this.roles = await RolesMock.new();
  });

  it('reverts when querying roles for the zero account', async function () {
    await expectRevert(this.roles.has(ZERO_ADDRESS), 'Roles: account is the zero address');
  });

  context('initially', function () {
    it('doesn\'t pre-assign roles', async function () {
      expect(await this.roles.has(authorized)).to.equal(false);
      expect(await this.roles.has(otherAuthorized)).to.equal(false);
      expect(await this.roles.has(other)).to.equal(false);
    });

    describe('adding roles', function () {
      it('adds roles to a single account', async function () {
        await this.roles.add(authorized);
        expect(await this.roles.has(authorized)).to.equal(true);
        expect(await this.roles.has(other)).to.equal(false);
      });

      it('reverts when adding roles to an already assigned account', async function () {
        await this.roles.add(authorized);
        await expectRevert(this.roles.add(authorized), 'Roles: account already has role');
      });

      it('reverts when adding roles to the zero account', async function () {
        await expectRevert(this.roles.add(ZERO_ADDRESS), 'Roles: account is the zero address');
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
        expect(await this.roles.has(authorized)).to.equal(false);
        expect(await this.roles.has(otherAuthorized)).to.equal(true);
      });

      it('reverts when removing unassigned roles', async function () {
        await expectRevert(this.roles.remove(other), 'Roles: account does not have role');
      });

      it('reverts when removing roles from the zero account', async function () {
        await expectRevert(this.roles.remove(ZERO_ADDRESS), 'Roles: account is the zero address');
      });
    });
  });
});
