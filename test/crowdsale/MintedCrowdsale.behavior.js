const { balance, expectEvent } = require('openzeppelin-test-helpers');

function shouldBehaveLikeMintedCrowdsale ([_, investor, wallet, purchaser], rate, value) {
  const expectedTokenAmount = rate.mul(value);

  describe('as a minted crowdsale', function () {
    describe('accepting payments', function () {
      it('should accept payments', async function () {
        await this.crowdsale.send(value);
        await this.crowdsale.buyTokens(investor, { value: value, from: purchaser });
      });
    });

    describe('high-level purchase', function () {
      it('should log purchase', async function () {
        const { logs } = await this.crowdsale.sendTransaction({ value: value, from: investor });
        expectEvent.inLogs(logs, 'TokensPurchased', {
          purchaser: investor,
          beneficiary: investor,
          value: value,
          amount: expectedTokenAmount,
        });
      });

      it('should assign tokens to sender', async function () {
        await this.crowdsale.sendTransaction({ value: value, from: investor });
        (await this.token.balanceOf(investor)).should.be.bignumber.equal(expectedTokenAmount);
      });

      it('should forward funds to wallet', async function () {
        const balanceTracker = await balance.tracker(wallet);
        await this.crowdsale.sendTransaction({ value, from: investor });
        (await balanceTracker.delta()).should.be.bignumber.equal(value);
      });
    });
  });
}

module.exports = {
  shouldBehaveLikeMintedCrowdsale,
};
