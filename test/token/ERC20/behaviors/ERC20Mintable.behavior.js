const { assertRevert } = require('../../../helpers/assertRevert');
const expectEvent = require('../../../helpers/expectEvent');

const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-bignumber')(BigNumber))
  .should();

function shouldBehaveLikeERC20Mintable (minter, [anyone]) {
  const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

  describe('as a mintable token', function () {
    describe('mintingFinished', function () {
      context('when token minting is not finished', function () {
        it('returns false', async function () {
          (await this.token.mintingFinished()).should.equal(false);
        });
      });

      context('when token minting is finished', function () {
        beforeEach(async function () {
          await this.token.finishMinting({ from: minter });
        });

        it('returns true', async function () {
          (await this.token.mintingFinished()).should.equal(true);
        });
      });
    });

    describe('finishMinting', function () {
      context('when the sender has minting permission', function () {
        const from = minter;

        context('when token minting was not finished', function () {
          it('finishes token minting', async function () {
            await this.token.finishMinting({ from });

            (await this.token.mintingFinished()).should.equal(true);
          });

          it('emits a mint finished event', async function () {
            const { logs } = await this.token.finishMinting({ from });

            await expectEvent.inLogs(logs, 'MintingFinished');
          });
        });

        context('when token minting was already finished', function () {
          beforeEach(async function () {
            await this.token.finishMinting({ from });
          });

          it('reverts', async function () {
            await assertRevert(this.token.finishMinting({ from }));
          });
        });
      });

      context('when the sender doesn\'t have minting permission', function () {
        const from = anyone;

        context('when token minting was not finished', function () {
          it('reverts', async function () {
            await assertRevert(this.token.finishMinting({ from }));
          });
        });

        context('when token minting was already finished', function () {
          beforeEach(async function () {
            await this.token.finishMinting({ from: minter });
          });

          it('reverts', async function () {
            await assertRevert(this.token.finishMinting({ from }));
          });
        });
      });
    });

    describe('mint', function () {
      const amount = 100;

      context('when the sender has minting permission', function () {
        const from = minter;

        context('when token minting is not finished', function () {
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

        context('when token minting is finished', function () {
          beforeEach(async function () {
            await this.token.finishMinting({ from: minter });
          });

          it('reverts', async function () {
            await assertRevert(this.token.mint(anyone, amount, { from }));
          });
        });
      });

      context('when the sender doesn\'t have minting permission', function () {
        const from = anyone;

        context('when token minting is not finished', function () {
          it('reverts', async function () {
            await assertRevert(this.token.mint(anyone, amount, { from }));
          });
        });

        context('when token minting is already finished', function () {
          beforeEach(async function () {
            await this.token.finishMinting({ from: minter });
          });

          it('reverts', async function () {
            await assertRevert(this.token.mint(anyone, amount, { from }));
          });
        });
      });
    });
  });
}

module.exports = {
  shouldBehaveLikeERC20Mintable,
};
