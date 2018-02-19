import ether from '../helpers/ether';

const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-as-promised'))
  .should();

const WhitelistedCrowdsale = artifacts.require('WhitelistedCrowdsaleImpl');
const SimpleToken = artifacts.require('SimpleToken');

contract('WhitelistedCrowdsale', function ([_, wallet, authorized, unauthorized]) {
  const rate = 1;
  const value = ether(42);
  const tokenSupply = new BigNumber('1e22');

  beforeEach(async function () {
    this.token = await SimpleToken.new();
    this.crowdsale = await WhitelistedCrowdsale.new(rate, wallet, this.token.address);
    await this.token.transfer(this.crowdsale.address, tokenSupply);
    await this.crowdsale.addToWhitelist(authorized);
  });

  describe('accepting payments', function () {
    it('should accept payments to whitelisted (from whichever buyers)', async function () {
      await this.crowdsale.buyTokens(authorized, { value: value, from: authorized }).should.be.fulfilled;
      await this.crowdsale.buyTokens(authorized, { value: value, from: unauthorized }).should.be.fulfilled;
    });

    it('should reject payments to whitelisted (with whichever buyers)', async function () {
      await this.crowdsale.send(value).should.be.rejected;
      await this.crowdsale.buyTokens(unauthorized, { value: value, from: unauthorized }).should.be.rejected;
      await this.crowdsale.buyTokens(unauthorized, { value: value, from: authorized }).should.be.rejected;
    });

    it('should reject payments to addresses removed from whitelist', async function () {
      await this.crowdsale.removeFromWhitelist(authorized);
      await this.crowdsale.buyTokens(authorized, { value: value, from: authorized }).should.be.rejected;
    });
  });

  describe('reporting whitelisted', function () {
    it('should correctly report whitelisted addresses', async function () {
      let isAuthorized = await this.crowdsale.isWhitelisted(authorized);
      isAuthorized.should.equal(true);
      let isntAuthorized = await this.crowdsale.isWhitelisted(unauthorized);
      isntAuthorized.should.equal(false);
    });
  });
});
