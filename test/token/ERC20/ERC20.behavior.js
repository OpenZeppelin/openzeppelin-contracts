const { BN, constants, expectEvent, shouldFail } = require('openzeppelin-test-helpers');
const { ZERO_ADDRESS } = constants;

function shouldBehaveLikeERC20 (errorPrefix, initialSupply, initialHolder, recipient, anotherAccount) {
  describe('total supply', function () {
    it('returns the total amount of tokens', async function () {
      (await this.token.totalSupply()).should.be.bignumber.equal(initialSupply);
    });
  });

  describe('balanceOf', function () {
    describe('when the requested account has no tokens', function () {
      it('returns zero', async function () {
        (await this.token.balanceOf(anotherAccount)).should.be.bignumber.equal('0');
      });
    });

    describe('when the requested account has some tokens', function () {
      it('returns the total amount of tokens', async function () {
        (await this.token.balanceOf(initialHolder)).should.be.bignumber.equal(initialSupply);
      });
    });
  });

  describe('transfer', function () {
    describe('when the recipient is not the zero address', function () {
      const to = recipient;

      describe('when the sender does not have enough balance', function () {
        const amount = initialSupply.addn(1);

        it('reverts', async function () {
          await shouldFail.reverting.withMessage(this.token.transfer(to, amount, { from: initialHolder }),
            'SafeMath: subtraction overflow'
          );
        });
      });

      describe('when the sender has enough balance', function () {
        const amount = initialSupply;

        it('transfers the requested amount', async function () {
          await this.token.transfer(to, amount, { from: initialHolder });

          (await this.token.balanceOf(initialHolder)).should.be.bignumber.equal('0');

          (await this.token.balanceOf(to)).should.be.bignumber.equal(amount);
        });

        it('emits a transfer event', async function () {
          const { logs } = await this.token.transfer(to, amount, { from: initialHolder });

          expectEvent.inLogs(logs, 'Transfer', {
            from: initialHolder,
            to: to,
            value: amount,
          });
        });
      });
    });

    describe('when the recipient is the zero address', function () {
      const to = ZERO_ADDRESS;

      it('reverts', async function () {
        await shouldFail.reverting.withMessage(this.token.transfer(to, initialSupply, { from: initialHolder }),
          `${errorPrefix}: transfer to the zero address`
        );
      });
    });
  });

  describe('transfer from', function () {
    const spender = recipient;

    describe('when the recipient is not the zero address', function () {
      const to = anotherAccount;

      describe('when the spender has enough approved balance', function () {
        beforeEach(async function () {
          await this.token.approve(spender, initialSupply, { from: initialHolder });
        });

        describe('when the initial holder has enough balance', function () {
          const amount = initialSupply;

          it('transfers the requested amount', async function () {
            await this.token.transferFrom(initialHolder, to, amount, { from: spender });

            (await this.token.balanceOf(initialHolder)).should.be.bignumber.equal('0');

            (await this.token.balanceOf(to)).should.be.bignumber.equal(amount);
          });

          it('decreases the spender allowance', async function () {
            await this.token.transferFrom(initialHolder, to, amount, { from: spender });

            (await this.token.allowance(initialHolder, spender)).should.be.bignumber.equal('0');
          });

          it('emits a transfer event', async function () {
            const { logs } = await this.token.transferFrom(initialHolder, to, amount, { from: spender });

            expectEvent.inLogs(logs, 'Transfer', {
              from: initialHolder,
              to: to,
              value: amount,
            });
          });

          it('emits an approval event', async function () {
            const { logs } = await this.token.transferFrom(initialHolder, to, amount, { from: spender });

            expectEvent.inLogs(logs, 'Approval', {
              owner: initialHolder,
              spender: spender,
              value: await this.token.allowance(initialHolder, spender),
            });
          });
        });

        describe('when the initial holder does not have enough balance', function () {
          const amount = initialSupply.addn(1);

          it('reverts', async function () {
            await shouldFail.reverting.withMessage(this.token.transferFrom(
              initialHolder, to, amount, { from: spender }), 'SafeMath: subtraction overflow'
            );
          });
        });
      });

      describe('when the spender does not have enough approved balance', function () {
        beforeEach(async function () {
          await this.token.approve(spender, initialSupply.subn(1), { from: initialHolder });
        });

        describe('when the initial holder has enough balance', function () {
          const amount = initialSupply;

          it('reverts', async function () {
            await shouldFail.reverting.withMessage(this.token.transferFrom(
              initialHolder, to, amount, { from: spender }), 'SafeMath: subtraction overflow'
            );
          });
        });

        describe('when the initial holder does not have enough balance', function () {
          const amount = initialSupply.addn(1);

          it('reverts', async function () {
            await shouldFail.reverting.withMessage(this.token.transferFrom(
              initialHolder, to, amount, { from: spender }), 'SafeMath: subtraction overflow'
            );
          });
        });
      });
    });

    describe('when the recipient is the zero address', function () {
      const amount = initialSupply;
      const to = ZERO_ADDRESS;

      beforeEach(async function () {
        await this.token.approve(spender, amount, { from: initialHolder });
      });

      it('reverts', async function () {
        await shouldFail.reverting.withMessage(this.token.transferFrom(
          initialHolder, to, amount, { from: spender }), `${errorPrefix}: transfer to the zero address`
        );
      });
    });
  });

  describe('approve', function () {
    shouldBehaveLikeERC20Approve(errorPrefix, initialHolder, recipient, initialSupply,
      function (owner, spender, amount) {
        return this.token.approve(spender, amount, { from: owner });
      }
    );
  });
}

function shouldBehaveLikeERC20Approve (errorPrefix, owner, spender, supply, approve) {
  describe('when the spender is not the zero address', function () {
    describe('when the sender has enough balance', function () {
      const amount = supply;

      it('emits an approval event', async function () {
        const { logs } = await approve.call(this, owner, spender, amount);

        expectEvent.inLogs(logs, 'Approval', {
          owner: owner,
          spender: spender,
          value: amount,
        });
      });

      describe('when there was no approved amount before', function () {
        it('approves the requested amount', async function () {
          await approve.call(this, owner, spender, amount);

          (await this.token.allowance(owner, spender)).should.be.bignumber.equal(amount);
        });
      });

      describe('when the spender had an approved amount', function () {
        beforeEach(async function () {
          await approve.call(this, owner, spender, new BN(1));
        });

        it('approves the requested amount and replaces the previous one', async function () {
          await approve.call(this, owner, spender, amount);

          (await this.token.allowance(owner, spender)).should.be.bignumber.equal(amount);
        });
      });
    });

    describe('when the sender does not have enough balance', function () {
      const amount = supply.addn(1);

      it('emits an approval event', async function () {
        const { logs } = await approve.call(this, owner, spender, amount);

        expectEvent.inLogs(logs, 'Approval', {
          owner: owner,
          spender: spender,
          value: amount,
        });
      });

      describe('when there was no approved amount before', function () {
        it('approves the requested amount', async function () {
          await approve.call(this, owner, spender, amount);

          (await this.token.allowance(owner, spender)).should.be.bignumber.equal(amount);
        });
      });

      describe('when the spender had an approved amount', function () {
        beforeEach(async function () {
          await approve.call(this, owner, spender, new BN(1));
        });

        it('approves the requested amount and replaces the previous one', async function () {
          await approve.call(this, owner, spender, amount);

          (await this.token.allowance(owner, spender)).should.be.bignumber.equal(amount);
        });
      });
    });
  });

  describe('when the spender is the zero address', function () {
    it('reverts', async function () {
      await shouldFail.reverting.withMessage(approve.call(this, owner, ZERO_ADDRESS, supply),
        `${errorPrefix}: approve to the zero address`
      );
    });
  });
}

module.exports = {
  shouldBehaveLikeERC20,
  shouldBehaveLikeERC20Approve,
};
