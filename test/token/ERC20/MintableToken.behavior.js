const { assertRevert } = require('../../helpers/assertRevert');
const expectEvent = require('../../helpers/expectEvent');

const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-bignumber')(BigNumber))
  .should();

function shouldBehaveLikeMintableToken (minter, [anyone]) {
  const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

  describe('as a mintable token', function () {
    describe('mintingFinished', function () {
      context('when token minting is not finished', function () {
        it('returns false', async function () {
          (await this.token.mintingFinished()).should.be.false;
        });
      });

      context('when token minting is finished', function () {
        beforeEach(async function () {
          await this.token.finishMinting({ from: minter });
        });

        it('returns true', async function () {
          (await this.token.mintingFinished()).should.be.true;
        });
      });
    });

    describe('finishMinting', function () {
      context('when the sender has minting permission', function () {
        const from = minter;

        context('when token minting was not finished', function () {
          it('finishes token minting', async function () {
            await this.token.finishMinting({ from });

            (await this.token.mintingFinished()).should.be.true;
          });

          it('emits a mint finished event', async function () {
            const { logs } = await this.token.finishMinting({ from });

            logs.length.should.be.equal(1);
            logs[0].event.should.eq('MintFinished');
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
          it('mints the requested amount', async function () {
            await this.token.mint(anyone, amount, { from });

            (await this.token.balanceOf(anyone)).should.be.bignumber.equal(amount);
          });

          it('emits a mint and a transfer event', async function () {
            const { logs } = await this.token.mint(anyone, amount, { from });

            const mintEvent = expectEvent.inLogs(logs, 'Mint', {
              to: anyone,
            });
            mintEvent.args.amount.should.be.bignumber.equal(amount);

            const transferEvent = expectEvent.inLogs(logs, 'Transfer', {
              from: ZERO_ADDRESS,
              to: anyone,
            });
            transferEvent.args.value.should.be.bignumber.equal(amount);
          });
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
  shouldBehaveLikeMintableToken,
};
