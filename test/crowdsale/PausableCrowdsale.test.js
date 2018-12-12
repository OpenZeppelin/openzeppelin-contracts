const shouldFail = require('../helpers/shouldFail');
const expectEvent = require('../helpers/expectEvent');

const PausableCrowdsale = artifacts.require('PausableCrowdsaleImpl');
const SimpleToken = artifacts.require('SimpleToken');

require('../helpers/setup');

contract('PausableCrowdsale', function ([_, pauser, wallet, anyone]) {
  const rate = 1;
  const value = 1;

  beforeEach('setting up', async function () {
    const from = pauser;

    this.token = await SimpleToken.new({ from });
    this.crowdsale = await PausableCrowdsale.new(rate, wallet, this.token.address, { from });
    await this.token.transfer(this.crowdsale.address, value, { from });
  });

  describe('pause()', function () {
    describe('when the sender is the crowdsale pauser', function () {
      const from = pauser;

      describe('when the crowdsale is unpaused', function () {
        beforeEach('pausing', async function () {
          const { logs } = await this.crowdsale.pause({ from });
          this.logs = logs;
        });

        it('pauses the crowdsale', async function () {
          const paused = await this.crowdsale.paused();
          paused.should.equal(true);
        });

        it('emits a Paused event', async function () {
          expectEvent.inLogs(this.logs, 'Paused');
        });
      });

      describe('when the crowdsale is paused', function () {
        beforeEach('pausing', async function () {
          await this.crowdsale.pause({ from });
        });

        it('reverts', async function () {
          await shouldFail.reverting(this.crowdsale.pause({ from }));
        });
      });
    });

    describe('when the sender is not the crowdsale pauser', function () {
      const from = anyone;

      it('reverts', async function () {
        await shouldFail.reverting(this.crowdsale.pause({ from }));
      });
    });
  });

  describe('unpause()', function () {
    describe('when the sender is the crowdsale pauser', function () {
      const from = pauser;

      describe('when the crowdsale is paused', function () {
        beforeEach(async function () {
          await this.crowdsale.pause({ from });
        });

        it('unpauses the crowdsale', async function () {
          await this.crowdsale.unpause({ from });
          const paused = await this.crowdsale.paused();
          paused.should.equal(false);
        });

        it('emits an Unpause event', async function () {
          const { logs } = await this.crowdsale.unpause({ from });
          expectEvent.inLogs(logs, 'Unpaused');
        });
      });

      describe('when the crowdsale is unpaused', function () {
        it('reverts', async function () {
          await shouldFail.reverting(this.crowdsale.unpause({ from }));
        });
      });
    });

    describe('when the sender is not the crowdsale pauser', function () {
      const from = anyone;

      it('reverts', async function () {
        await shouldFail.reverting(this.crowdsale.unpause({ from }));
      });
    });
  });

  describe('paused', function () {
    const from = pauser;

    it('is not paused by default', async function () {
      const paused = await this.crowdsale.paused({ from });
      paused.should.equal(false);
    });

    it('is paused after being paused', async function () {
      await this.crowdsale.pause({ from });
      const paused = await this.crowdsale.paused({ from });
      paused.should.equal(true);
    });

    it('is not paused after being paused and then unpaused', async function () {
      await this.crowdsale.pause({ from });
      await this.crowdsale.unpause({ from });
      const paused = await this.crowdsale.paused({ from });
      paused.should.equal(false);
    });
  });

  describe('when the crowdsale is paused', function () {
    const from = pauser;

    beforeEach('pausing', async function () {
      await this.crowdsale.pause({ from });
    });

    describe('high-level purchase using fallback function', function () {
      it('reverts', async function () {
        await shouldFail.reverting(this.crowdsale.sendTransaction({ from, value }));
      });
    });

    describe('buyTokens()', function () {
      it('reverts', async function () {
        await shouldFail.reverting(this.crowdsale.buyTokens(from, { from, value }));
      });
    });
  });

  describe('when the crowdsale is unpaused', function () {
    const from = pauser;

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
