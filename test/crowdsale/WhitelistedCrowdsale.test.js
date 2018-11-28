const { ether } = require('../helpers/ether');
const shouldFail = require('../helpers/shouldFail');

const BigNumber = web3.BigNumber;

require('chai')
  .should();

const WhitelistedCrowdsale = artifacts.require('WhitelistedCrowdsaleImpl');
const SimpleToken = artifacts.require('SimpleToken');

contract('WhitelistedCrowdsale', function ([_, wallet, whitelister, whitelistee, otherWhitelistee, anyone]) {
  const rate = 1;
  const value = ether(42);
  const tokenSupply = new BigNumber('1e22');

  beforeEach(async function () {
    this.token = await SimpleToken.new({ from: whitelister });
    this.crowdsale = await WhitelistedCrowdsale.new(rate, wallet, this.token.address, { from: whitelister });
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
    it('rejects payments from all addresses', async function () {
      await purchaseShouldFail(this.crowdsale, anyone, value);
      await purchaseShouldFail(this.crowdsale, whitelistee, value);
    });
  });

  context('with whitelited addresses', function () {
    beforeEach(async function () {
      await this.crowdsale.addWhitelistee(whitelistee, { from: whitelister });
      await this.crowdsale.addWhitelistee(otherWhitelistee, { from: whitelister });
    });

    it('accepts payments from whitelisted addresses', async function () {
      await purchaseShouldSucceed(this.crowdsale, whitelistee, value);
      await purchaseShouldSucceed(this.crowdsale, otherWhitelistee, value);
    });

    it('rejects payments from unwhitelisted addresses', async function () {
      await purchaseShouldFail(this.crowdsale, anyone, value);
    });
  });
});
