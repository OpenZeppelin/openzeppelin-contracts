const { expectRevert, constants, expectEvent } = require('@openzeppelin/test-helpers');
const { ZERO_ADDRESS } = constants;

const { expect } = require('chai');

function capitalize (str) {
  return str.replace(/\b\w/g, l => l.toUpperCase());
}

// Tests that a role complies with the standard role interface, that is:
//  * an onlyRole modifier
//  * an isRole function
//  * an addRole function, accessible to role havers
//  * a renounceRole function
//  * roleAdded and roleRemoved events
// Both the modifier and an additional internal remove function are tested through a mock contract that exposes them.
// This mock contract should be stored in this.contract.
//
// @param authorized an account that has the role
// @param otherAuthorized another account that also has the role
// @param other an account that doesn't have the role, passed inside an array for ergonomics
// @param rolename a string with the name of the role
// @param manager undefined for regular roles, or a manager account for managed roles. In these, only the manager
// account can create and remove new role bearers.
function shouldBehaveLikePublicRole (authorized, otherAuthorized, [other], rolename, manager) {
  rolename = capitalize(rolename);

  describe('should behave like public role', function () {
    beforeEach('check preconditions', async function () {
      expect(await this.contract[`is${rolename}`](authorized)).to.equal(true);
      expect(await this.contract[`is${rolename}`](otherAuthorized)).to.equal(true);
      expect(await this.contract[`is${rolename}`](other)).to.equal(false);
    });

    if (manager === undefined) { // Managed roles are only assigned by the manager, and none are set at construction
      it('emits events during construction', async function () {
        await expectEvent.inConstruction(this.contract, `${rolename}Added`, {
          account: authorized,
        });
      });
    }

    it('reverts when querying roles for the null account', async function () {
      await expectRevert(this.contract[`is${rolename}`](ZERO_ADDRESS),
        'Roles: account is the zero address'
      );
    });

    describe('access control', function () {
      context('from authorized account', function () {
        const from = authorized;

        it('allows access', async function () {
          await this.contract[`only${rolename}Mock`]({ from });
        });
      });

      context('from unauthorized account', function () {
        const from = other;

        it('reverts', async function () {
          await expectRevert(this.contract[`only${rolename}Mock`]({ from }),
            `${rolename}Role: caller does not have the ${rolename} role`
          );
        });
      });
    });

    describe('add', function () {
      const from = manager === undefined ? authorized : manager;

      context(`from ${manager ? 'the manager' : 'a role-haver'} account`, function () {
        it('adds role to a new account', async function () {
          await this.contract[`add${rolename}`](other, { from });
          expect(await this.contract[`is${rolename}`](other)).to.equal(true);
        });

        it(`emits a ${rolename}Added event`, async function () {
          const receipt = await this.contract[`add${rolename}`](other, { from });
          expectEvent(receipt, `${rolename}Added`, { account: other });
        });

        it('reverts when adding role to an already assigned account', async function () {
          await expectRevert(this.contract[`add${rolename}`](authorized, { from }),
            'Roles: account already has role'
          );
        });

        it('reverts when adding role to the null account', async function () {
          await expectRevert(this.contract[`add${rolename}`](ZERO_ADDRESS, { from }),
            'Roles: account is the zero address'
          );
        });
      });
    });

    describe('remove', function () {
      // Non-managed roles have no restrictions on the mocked '_remove' function (exposed via 'remove').
      const from = manager || other;

      context(`from ${manager ? 'the manager' : 'any'} account`, function () {
        it('removes role from an already assigned account', async function () {
          await this.contract[`remove${rolename}`](authorized, { from });
          expect(await this.contract[`is${rolename}`](authorized)).to.equal(false);
          expect(await this.contract[`is${rolename}`](otherAuthorized)).to.equal(true);
        });

        it(`emits a ${rolename}Removed event`, async function () {
          const receipt = await this.contract[`remove${rolename}`](authorized, { from });
          expectEvent(receipt, `${rolename}Removed`, { account: authorized });
        });

        it('reverts when removing from an unassigned account', async function () {
          await expectRevert(this.contract[`remove${rolename}`](other, { from }),
            'Roles: account does not have role'
          );
        });

        it('reverts when removing role from the null account', async function () {
          await expectRevert(this.contract[`remove${rolename}`](ZERO_ADDRESS, { from }),
            'Roles: account is the zero address'
          );
        });
      });
    });

    describe('renouncing roles', function () {
      it('renounces an assigned role', async function () {
        await this.contract[`renounce${rolename}`]({ from: authorized });
        expect(await this.contract[`is${rolename}`](authorized)).to.equal(false);
      });

      it(`emits a ${rolename}Removed event`, async function () {
        const receipt = await this.contract[`renounce${rolename}`]({ from: authorized });
        expectEvent(receipt, `${rolename}Removed`, { account: authorized });
      });

      it('reverts when renouncing unassigned role', async function () {
        await expectRevert(this.contract[`renounce${rolename}`]({ from: other }),
          'Roles: account does not have role'
        );
      });
    });
  });
}

module.exports = {
  shouldBehaveLikePublicRole,
};
