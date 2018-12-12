const shouldFail = require('../helpers/shouldFail');

const PausableCrowdsale = artifacts.require('PausableCrowdsaleImpl');
const SimpleToken = artifacts.require('SimpleToken');

require('../helpers/setup');

contract('PausableCrowdsale', function ([_, pauser, wallet, anyone]) {
  const rate = 1;
  const value = 1;

  beforeEach(async function () {
    const from = pauser;

    this.token = await SimpleToken.new({ from });
    this.crowdsale = await PausableCrowdsale.new(rate, wallet, this.token.address, { from });
    await this.token.transfer(this.crowdsale.address, 2 * value, { from });
  });

  it('purchases work', async function () {
    const from = anyone;

    await this.crowdsale.sendTransaction({ from, value });
    await this.crowdsale.buyTokens(from, { from, value });
  });

  context('after pause', function () {
    beforeEach(async function () {
      await this.crowdsale.pause({ from: pauser });
    });

    it('purchases do not work', async function () {
      const from = anyone;

      await shouldFail.reverting(this.crowdsale.sendTransaction({ from, value }));
      await shouldFail.reverting(this.crowdsale.buyTokens(from, { from, value }));
    });

    context('after unpause', function () {
      beforeEach(async function () {
        await this.crowdsale.unpause({ from: pauser });
      });

      it('purchases work', async function () {
        const from = anyone;

        await this.crowdsale.sendTransaction({ from, value });
        await this.crowdsale.buyTokens(from, { from, value });
      });
    });
  });
});
