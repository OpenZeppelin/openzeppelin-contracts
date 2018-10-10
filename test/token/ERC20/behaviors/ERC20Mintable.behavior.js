const shouldFail = require('../../../helpers/shouldFail');
const expectEvent = require('../../../helpers/expectEvent');
const { ZERO_ADDRESS } = require('../../../helpers/constants');

const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-bignumber')(BigNumber))
  .should();

function shouldBehaveLikeERC20Mintable (minter, [anyone]) {
  describe('as a mintable token', function () {
    describe('mint', function () {
      const amount = 100;

      context('when the sender has minting permission', function () {
        const from = minter;

        context('for a zero amount', function () {
          shouldMint(0);
        });

        context('for a non-zero amount', function () {
          shouldMint(amount);
        });

        function shouldMint (amount) {
          beforeEach(async function () {
            ({ logs: this.logs } = await this.token.mint(anyone, amount, { from }));
          });

          it('mints the requested amount', async function () {
            (await this.token.balanceOf(anyone)).should.be.bignumber.equal(amount);
          });

          it('emits a mint and a transfer event', async function () {
            expectEvent.inLogs(this.logs, 'Transfer', {
              from: ZERO_ADDRESS,
              to: anyone,
              value: amount,
            });
          });
        }
      });

      context('when the sender doesn\'t have minting permission', function () {
        const from = anyone;

        it('reverts', async function () {
          await shouldFail.reverting(this.token.mint(anyone, amount, { from }));
        });
      });
    });
  });
}

module.exports = {
  shouldBehaveLikeERC20Mintable,
};
