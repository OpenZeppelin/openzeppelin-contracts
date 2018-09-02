const { assertRevert } = require('../helpers/assertRevert');

const PausableCrowdsale = artifacts.require('PausableCrowdsaleImpl');
const SimpleToken = artifacts.require('SimpleToken');

const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-bignumber')(BigNumber))
  .should();

contract('PausableCrowdsale', function ([owner, wallet, stranger]) {
  const rate = 1;
  const value = 1;

  beforeEach(async function () {
    this.token = await SimpleToken.new();
    this.crowdsale = await PausableCrowdsale.new(rate, wallet, this.token.address);
    await this.token.transfer(this.crowdsale.address, value);
  });

  describe('pause()', function () {
    describe('when the sender is the crowdsale owner', function () {
      const from = owner;

      describe('when the crowdsale is unpaused', function () {
        it('pauses the crowdsale', async function () {
          await this.crowdsale.pause({ from });
          const paused = await this.crowdsale.paused();
          assert.equal(paused, true);
        });

        it('emits a Pause event', async function () {
          const { logs } = await this.crowdsale.pause({ from });
          assert.equal(logs.length, 1);
          assert.equal(logs[0].event, 'Paused');
        });
      });

      describe('when the crowdsale is paused', function () {
        beforeEach(async function () {
          await this.crowdsale.pause({ from });
        });

        it('reverts', async function () {
          await assertRevert(this.crowdsale.pause({ from }));
        });
      });
    });

    describe('when the sender is not the crowdsale owner', function () {
      const from = stranger;

      it('reverts', async function () {
        await assertRevert(this.crowdsale.pause({ from }));
      });
    });
  });

  describe('unpause()', function () {
    describe('when the sender is the crowdsale owner', function () {
      const from = owner;

      describe('when the crowdsale is paused', function () {
        beforeEach(async function () {
          await this.crowdsale.pause({ from });
        });

        it('unpauses the crowdsale', async function () {
          await this.crowdsale.unpause({ from });
          const paused = await this.crowdsale.paused();
          assert.equal(paused, false);
        });

        it('emits an Unpause event', async function () {
          const { logs } = await this.crowdsale.unpause({ from });
          assert.equal(logs.length, 1);
          assert.equal(logs[0].event, 'Unpaused');
        });
      });

      describe('when the crowdsale is unpaused', function () {
        it('reverts', async function () {
          await assertRevert(this.crowdsale.unpause({ from }));
        });
      });
    });

    describe('when the sender is not the crowdsale owner', function () {
      const from = stranger;

      it('reverts', async function () {
        await assertRevert(this.crowdsale.unpause({ from }));
      });
    });
  });

  describe('paused', function () {
    const from = owner;

    it('is not paused by default', async function () {
      const paused = await this.crowdsale.paused({ from });
      assert.equal(paused, false);
    });

    it('is paused after being paused', async function () {
      await this.crowdsale.pause({ from });
      const paused = await this.crowdsale.paused({ from });
      assert.equal(paused, true);
    });

    it('is not paused after being paused and then unpaused', async function () {
      await this.crowdsale.pause({ from });
      await this.crowdsale.unpause({ from });
      const paused = await this.crowdsale.paused({ from });
      assert.equal(paused, false);
    });
  });

  describe('when the crowdsale is paused', function () {
    const from = owner;

    beforeEach(async function () {
      await this.crowdsale.pause({ from });
    });

    describe('high-level purchase using fallback function', function () {
      it('reverts', async function () {
        await assertRevert(this.crowdsale.sendTransaction({ from, value }));
      });
    });

    describe('buyTokens()', function () {
      it('reverts', async function () {
        await assertRevert(this.crowdsale.buyTokens(from, { from, value }));
      });
    });
  });

  describe('when the crowdsale is unpaused', function () {
    const from = owner;

    describe('high-level purchase using fallback function', function () {
      it('should accept payments', async function () {
        await this.crowdsale.sendTransaction({ from, value });
      });
    });

    describe('buyTokens()', function () {
      it('should accept payments', async function () {
        await this.crowdsale.buyTokens(from, { from, value });
      });
    });
  });
});
