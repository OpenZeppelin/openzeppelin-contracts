const { assertRevert } = require('../../helpers/assertRevert');

require('chai')
  .should();

function capitalize (str) {
  return str.replace(/\b\w/g, l => l.toUpperCase());
}

function shouldBehaveLikePublicRole (authorized, otherAuthorized, [anyone], rolename) {
  rolename = capitalize(rolename);
  const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

  describe(`role ${rolename}`, function () {
    beforeEach('check preconditions', async function () {
      (await this.contract[`is${rolename}`](authorized)).should.equal(true);
      (await this.contract[`is${rolename}`](otherAuthorized)).should.equal(true);
      (await this.contract[`is${rolename}`](anyone)).should.equal(false);
    });

    describe('add', function () {
      it('adds role to a new account', async function () {
        await this.contract[`add${rolename}`](authorized);
        (await this.contract[`is${rolename}`](authorized)).should.equal(true);
        (await this.contract[`is${rolename}`](anyone)).should.equal(false);
      });

      it('adds role to an already-assigned account', async function () {
        await this.contract[`add${rolename}`](authorized);
        await this.contract[`add${rolename}`](authorized);
        (await this.contract[`is${rolename}`](authorized)).should.equal(true);
      });

      it('doesn\'t revert when adding role to the null account', async function () {
        await this.contract[`add${rolename}`](ZERO_ADDRESS);
      });
    });

    describe('remove', function () {
      it('removes role from an already assgined account', async function () {
        await this.contract[`remove${rolename}`](authorized);
        (await this.contract[`is${rolename}`](authorized)).should.equal(false);
        (await this.contract[`is${rolename}`](otherAuthorized)).should.equal(true);
      });

      it('doesn\'t revert when removing from an unassigned account', async function () {
        await this.contract[`remove${rolename}`](anyone);
      });

      it('doesn\'t revert when removing role from the null account', async function () {
        await this.contract[`remove${rolename}`](ZERO_ADDRESS);
      });
    });

    describe('transfering', function () {
      context('from account with role', function () {
        const from = authorized;

        it('transfers to other account without the role', async function () {
          await this.contract[`transfer${rolename}`](anyone, { from });
          (await this.contract[`is${rolename}`](anyone)).should.equal(true);
          (await this.contract[`is${rolename}`](authorized)).should.equal(false);
        });

        it('reverts when transfering to an account with role', async function () {
          await assertRevert(this.contract[`transfer${rolename}`](otherAuthorized, { from }));
        });

        it('reverts when transfering to the null account', async function () {
          await assertRevert(this.contract[`transfer${rolename}`](ZERO_ADDRESS, { from }));
        });
      });

      context('from account without role', function () {
        const from = anyone;

        it('reverts', async function () {
          await assertRevert(this.contract[`transfer${rolename}`](anyone, { from }));
        });
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
