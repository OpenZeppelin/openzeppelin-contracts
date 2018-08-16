const CapStagedCrowdsale = artifacts.require('CapStagedCrowdsale');
const BigNumber = web3.BigNumber;
const SimpleToken = artifacts.require('SimpleToken');
const { assertRevert } = require('../helpers/assertRevert');
const { expectThrow } = require('../helpers/expectThrow');
const { EVMRevert } = require('../helpers/EVMRevert');
require('chai')
  .use(require('chai-bignumber')(BigNumber))
  .should();

contract('CapStagedCrowdsale', function ([_, owner, wallet, investor]) {
  const _rate = new BigNumber(1000);
  const _value = web3.toWei('1', 'ether');//  10ether
  const stages = [
    { limit: web3.toWei(1, 'ether'), rate: new BigNumber(40) },
    { limit: web3.toWei(2, 'ether'), rate: new BigNumber(30) },
    { limit: web3.toWei(3, 'ether'), rate: new BigNumber(20) },
  ];
  const rates = stages.map((s) => s.rate);
  const limits = stages.map((s) => s.limit);
  const wrongStages = [
    { limit: web3.toWei(3, 'ether'), rate: new BigNumber(40) },
    { limit: web3.toWei(2, 'ether'), rate: new BigNumber(30) },
    { limit: web3.toWei(1, 'ether'), rate: new BigNumber(20) },
  ];
  const wrongRates = wrongStages.map((s) => s.rate);
  const wrongLimits = wrongStages.map((s) => s.limit);
  const capital = web3.toWei(3, 'ether');
  const tokenSupply = web3.toWei(160, 'ether');
  describe('sending stages in correct order', function () {
    beforeEach(async function () {
      this.token = await SimpleToken.new({ from: owner });
      this.crowdsale = await CapStagedCrowdsale
        .new(_rate, wallet, this.token.address, capital, limits, rates, { from: owner });
      await this.token.transfer(this.crowdsale.address, tokenSupply, { from: owner });
    });
    context('stage 1', function () {
      it('should accept payments in stage 1 (rate 40)', async function () {
        await this.crowdsale.buyTokens(investor, { from: investor, value: _value });
        const wi = await this.crowdsale.weiRaised();
        assert(wi.should.be.bignumber.eq(web3.toWei(1, 'ether')));
      });
    });
    context('stage 2', function () {
      it('should accept payments in stage 2 (rate 30)', async function () {
        await this.crowdsale.buyTokens(investor, { from: investor, value: _value * 2 });
        const wi = await this.crowdsale.weiRaised();
        assert(wi.should.be.bignumber.eq(web3.toWei(2, 'ether')));
      });
    });
    context('stage 3', function () {
      it('should accept payments in stage 3 (rate 20)', async function () {
        await this.crowdsale.buyTokens(investor, { from: investor, value: _value * 3 });
        const wi = await this.crowdsale.weiRaised();
        assert(wi.should.be.bignumber.eq(web3.toWei(3, 'ether')));
      });
    });
    context('over last stage limit', function () {
      it('should reject payments over last stage limit (stage 3, rate 20)', async function () {
        await this.crowdsale.buyTokens(investor, { from: investor, value: _value * 3 });
        const wi = await this.crowdsale.weiRaised();
        assert(wi.should.be.bignumber.eq(web3.toWei(3, 'ether')));
        await expectThrow(
          this.crowdsale.buyTokens(investor, { from: investor, value: _value * 1 }),
          EVMRevert,
        );
      });
    });
  });
  describe('sending stages in wrong order', function () {
    it('shoud be reverted', async function () {
      this.token = await SimpleToken.new({ from: owner });
      await assertRevert(CapStagedCrowdsale
        .new(_rate, wallet, this.token.address, capital, wrongLimits, wrongRates, { from: owner }));
    });
  });
});
