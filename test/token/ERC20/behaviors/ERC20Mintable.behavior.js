const { assertRevert } = require('../../helpers/assertRevert');
const expectEvent = require('../../helpers/expectEvent');

const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-bignumber')(BigNumber))
  .should();

function shouldBehaveLikeERC20Mintable (owner, minter, [anyone]) {
  const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

  describe('as a basic mintable token', function () {
    describe('after token creation', function () {
      it('sender should be token owner', async function () {
        (await this.token.owner({ from: owner })).should.equal(owner);
      });
    });

    describe('minting finished', function () {
      describe('when the token minting is not finished', function () {
        it('returns false', async function () {
          (await this.token.mintingFinished()).should.equal(false);
        });
      });

      describe('when the token is minting finished', function () {
        beforeEach(async function () {
          await this.token.finishMinting({ from: owner });
        });

        it('returns true', async function () {
          (await this.token.mintingFinished()).should.equal(true);
        });
      });
    });

    describe('finish minting', function () {
      describe('when the sender is the token owner', function () {
        const from = owner;

        describe('when the token minting was not finished', function () {
          it('finishes token minting', async function () {
            await this.token.finishMinting({ from });

            (await this.token.mintingFinished()).should.equal(true);
          });

          it('emits a mint finished event', async function () {
            const { logs } = await this.token.finishMinting({ from });

            logs.length.should.be.equal(1);
            logs[0].event.should.equal('MintFinished');
          });
        });

        describe('when the token minting was already finished', function () {
          beforeEach(async function () {
            await this.token.finishMinting({ from });
          });

          it('reverts', async function () {
            await assertRevert(this.token.finishMinting({ from }));
          });
        });
      });

      describe('when the sender is not the token owner', function () {
        const from = anyone;

        describe('when the token minting was not finished', function () {
          it('reverts', async function () {
            await assertRevert(this.token.finishMinting({ from }));
          });
        });

        describe('when the token minting was already finished', function () {
          beforeEach(async function () {
            await this.token.finishMinting({ from: owner });
          });

          it('reverts', async function () {
            await assertRevert(this.token.finishMinting({ from }));
          });
        });
      });
    });

    describe('mint', function () {
      const amount = 100;

      describe('when the sender has the minting permission', function () {
        const from = minter;

        describe('when the token minting is not finished', function () {
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
              const mintEvent = expectEvent.inLogs(this.logs, 'Mint', {
                to: anyone,
              });
              mintEvent.args.amount.should.be.bignumber.equal(amount);

              const transferEvent = expectEvent.inLogs(this.logs, 'Transfer', {
                from: ZERO_ADDRESS,
                to: anyone,
              });
              transferEvent.args.value.should.be.bignumber.equal(amount);
            });
          }
        });

        describe('when the token minting is finished', function () {
          beforeEach(async function () {
            await this.token.finishMinting({ from: owner });
          });

          it('reverts', async function () {
            await assertRevert(this.token.mint(anyone, amount, { from }));
          });
        });
      });

      describe('when the sender has not the minting permission', function () {
        const from = anyone;

        describe('when the token minting is not finished', function () {
          it('reverts', async function () {
            await assertRevert(this.token.mint(anyone, amount, { from }));
          });
        });

        describe('when the token minting is already finished', function () {
          beforeEach(async function () {
            await this.token.finishMinting({ from: owner });
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
