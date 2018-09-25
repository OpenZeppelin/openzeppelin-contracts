const { assertRevert } = require('../../../helpers/assertRevert');
const expectEvent = require('../../../helpers/expectEvent');

const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-bignumber')(BigNumber))
  .should();

function shouldBehaveLikeERC20Mintable (minter, [anyone]) {
  const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

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
            const transferEvent = expectEvent.inLogs(this.logs, 'Transfer', {
              from: ZERO_ADDRESS,
              to: anyone,
            });
            transferEvent.args.value.should.be.bignumber.equal(amount);
          });
        }
      });

      context('when the sender doesn\'t have minting permission', function () {
        const from = anyone;

        it('reverts', async function () {
          await assertRevert(this.token.mint(anyone, amount, { from }));
        });
      });
    });
  });
}

module.exports = {
  shouldBehaveLikeERC20Mintable,
};
