const { assertRevert } = require('../../helpers/assertRevert');
const expectEvent = require('../../helpers/expectEvent');

require('chai')
  .should();

function capitalize (str) {
  return str.replace(/\b\w/g, l => l.toUpperCase());
}

function shouldBehaveLikePublicRole (authorized, otherAuthorized, [anyone], rolename) {
  rolename = capitalize(rolename);
  const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

  describe('should behave like public role', function () {
    beforeEach('check preconditions', async function () {
      (await this.contract[`is${rolename}`](authorized)).should.equal(true);
      (await this.contract[`is${rolename}`](otherAuthorized)).should.equal(true);
      (await this.contract[`is${rolename}`](anyone)).should.equal(false);
    });

    it('reverts when querying roles for the null account', async function () {
      await assertRevert(this.contract[`is${rolename}`](ZERO_ADDRESS));
    });

    describe('access control', function () {
      context('from authorized account', function () {
        const from = authorized;

        it('allows access', async function () {
          await this.contract[`only${rolename}Mock`]({ from });
        });
      });

      context('from unauthorized account', function () {
        const from = anyone;

        it('reverts', async function () {
          await assertRevert(this.contract[`only${rolename}Mock`]({ from }));
        });
      });
    });

    describe('add', function () {
      it('adds role to a new account', async function () {
        await this.contract[`add${rolename}`](anyone, { from: authorized });
        (await this.contract[`is${rolename}`](anyone)).should.equal(true);
      });

      it(`emits a ${rolename}Added event`, async function () {
        const { logs } = await this.contract[`add${rolename}`](anyone, { from: authorized });
        expectEvent.inLogs(logs, `${rolename}Added`, { account: anyone });
      });

      it('adds role to an already-assigned account', async function () {
        await this.contract[`add${rolename}`](authorized, { from: authorized });
        (await this.contract[`is${rolename}`](authorized)).should.equal(true);
      });

      it('reverts when adding role to the null account', async function () {
        await assertRevert(this.contract[`add${rolename}`](ZERO_ADDRESS, { from: authorized }));
      });
    });

    describe('remove', function () {
      it('removes role from an already assigned account', async function () {
        await this.contract[`remove${rolename}`](authorized);
        (await this.contract[`is${rolename}`](authorized)).should.equal(false);
        (await this.contract[`is${rolename}`](otherAuthorized)).should.equal(true);
      });

      it(`emits a ${rolename}Removed event`, async function () {
        const { logs } = await this.contract[`remove${rolename}`](authorized);
        expectEvent.inLogs(logs, `${rolename}Removed`, { account: authorized });
      });

      it('doesn\'t revert when removing from an unassigned account', async function () {
        await this.contract[`remove${rolename}`](anyone);
      });

      it('reverts when removing role from the null account', async function () {
        await assertRevert(this.contract[`remove${rolename}`](ZERO_ADDRESS));
      });
    });

    describe('renouncing roles', function () {
      it('renounces an assigned role', async function () {
        await this.contract[`renounce${rolename}`]({ from: authorized });
        (await this.contract[`is${rolename}`](authorized)).should.equal(false);
      });

      it('doesn\'t revert when renouncing unassigned role', async function () {
        await this.contract[`renounce${rolename}`]({ from: anyone });
      });
    });
  });
}

module.exports = {
  shouldBehaveLikePublicRole,
};
