const { BN, ether, shouldFail } = require('openzeppelin-test-helpers');

const WhitelistCrowdsale = artifacts.require('WhitelistCrowdsaleImpl');
const SimpleToken = artifacts.require('SimpleToken');

contract('WhitelistCrowdsale', function ([_, wallet, whitelister, whitelisted, otherWhitelisted, other]) {
  const rate = new BN(1);
  const value = ether('42');
  const tokenSupply = new BN('10').pow(new BN('22'));

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
    await shouldFail.reverting.withMessage(crowdsale.buyTokens(beneficiary, { from: beneficiary, value }),
      'WhitelistCrowdsale: beneficiary doesn\'t have the Whitelisted role'
    );
    await shouldFail.reverting.withMessage(crowdsale.sendTransaction({ from: beneficiary, value }),
      'WhitelistCrowdsale: beneficiary doesn\'t have the Whitelisted role'
    );
  }

  context('with no whitelisted addresses', function () {
    it('rejects all purchases', async function () {
      await purchaseShouldFail(this.crowdsale, other, value);
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
      await shouldFail(this.crowdsale.buyTokens(other, { from: whitelisted, value }));
    });

    it('rejects purchases with non-whitelisted beneficiaries', async function () {
      await purchaseShouldFail(this.crowdsale, other, value);
    });
  });
});
