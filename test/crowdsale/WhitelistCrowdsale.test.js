require('../helpers/setup');
const { ether } = require('../helpers/ether');
const shouldFail = require('../helpers/shouldFail');

const BigNumber = web3.BigNumber;

const WhitelistCrowdsale = artifacts.require('WhitelistCrowdsaleImpl');
const SimpleToken = artifacts.require('SimpleToken');

contract('WhitelistCrowdsale', function ([_, wallet, whitelister, whitelisted, otherWhitelisted, anyone]) {
  const rate = 1;
  const value = ether(42);
  const tokenSupply = new BigNumber('1e22');

  beforeEach(async function () {
    this.token = await SimpleToken.new({ from: whitelister });
    this.crowdsale = await WhitelistCrowdsale.new(rate, wallet, this.token.address, { from: whitelister });
    await this.token.transfer(this.crowdsale.address, tokenSupply, { from: whitelister });
  });

  async function purchaseShouldSucceed (crowdsale, beneficiary, value) {
    await crowdsale.buyTokens(beneficiary, { from: beneficiary, value });
    await crowdsale.sendTransaction({ from: beneficiary, value });
  }

  async function purchaseShouldFail (crowdsale, beneficiary, value) {
    await shouldFail.reverting(crowdsale.buyTokens(beneficiary, { from: beneficiary, value }));
    await shouldFail.reverting(crowdsale.sendTransaction({ from: beneficiary, value }));
  }

  context('with no whitelisted addresses', function () {
    it('rejects all purchases', async function () {
      await purchaseShouldFail(this.crowdsale, anyone, value);
      await purchaseShouldFail(this.crowdsale, whitelisted, value);
    });
  });

  context('with whitelisted addresses', function () {
    beforeEach(async function () {
      await this.crowdsale.addWhitelisted(whitelisted, { from: whitelister });
      await this.crowdsale.addWhitelisted(otherWhitelisted, { from: whitelister });
    });

    it('accepts purchases with whitelisted beneficiaries', async function () {
      await purchaseShouldSucceed(this.crowdsale, whitelisted, value);
      await purchaseShouldSucceed(this.crowdsale, otherWhitelisted, value);
    });

    it('rejects purchases from whitelisted addresses with non-whitelisted beneficiaries', async function () {
      await shouldFail(this.crowdsale.buyTokens(anyone, { from: whitelisted, value }));
    });

    it('rejects purchases with non-whitelisted beneficiaries', async function () {
      await purchaseShouldFail(this.crowdsale, anyone, value);
    });
  });
});
