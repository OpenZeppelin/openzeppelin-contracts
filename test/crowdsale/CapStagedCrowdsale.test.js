const { ether } = require('../helpers/ether');
const CapStagedCrowdsale = artifacts.require('CapStagedCrowdsale');
const BigNumber = web3.BigNumber;
const CapStagedCrowdsaleToken = artifacts.require('CapStagedCrowdsaleToken');
require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

contract('CapStagedCrowdsale', function ([_, creator, wallet, investor]) {
  const _rate = new BigNumber(1000);
  const _value = web3.toWei('10', 'ether');//  10ether
  const stage1Limit = web3.toWei('10', 'ether');//  10ether
  const stage1Rate = new BigNumber(4000);
  const stage2Limit = web3.toWei('20', 'ether');//  10ether //  20ether
  const stage2Rate = new BigNumber(3000);
  const stage3Limit = web3.toWei('30', 'ether');//  10ether//  30ether
  const stage3Rate = new BigNumber(2000);
  const stLimits = [stage1Limit, stage2Limit, stage3Limit];
  const stRates = [stage1Rate, stage2Rate, stage3Rate];
  beforeEach(async function () {
    this._token = await CapStagedCrowdsaleToken.new();
    this._csale = await CapStagedCrowdsale.new(_rate, wallet, this._token.address, stLimits, stRates);
    await this._token.transfer(this._csale.address, 1000000000000000000000000);
    await this._token.transferOwnership(this._csale.address);
  });

  describe('should accept payments in stage 1 (rate 4000)', function () {
    it('should accept payments in stage 1 (rate 4000)', async function () {
      await this._csale.buyTokens(investor, { from: investor, value: _value }).should.be.fulfilled;
      const rt = await this._csale.getRate();
      assert(rt.should.be.bignumber.eq(4000));
      const wi = await this._csale.weiRaised();
      assert(wi.should.be.bignumber.eq(10000000000000000000));
    });
  });
  describe('should accept payments in stage 2 (rate 3000)', function () {
    it('should accept payments in stage 2 (rate 3000)', async function () {
      await this._csale.buyTokens(investor, { from: investor, value: _value * 2 }).should.be.fulfilled;
      const rt = await this._csale.getRate();
      assert(rt.should.be.bignumber.eq(3000));
      const wi = await this._csale.weiRaised();
      assert(wi.should.be.bignumber.eq(20000000000000000000));
    });
  });
  describe('should accept payments in stage 3 (rate 2000)', function () {
    it('should accept payments in stage 3 (rate 2000)', async function () {
      await this._csale.buyTokens(investor, { from: investor, value: _value * 3 }).should.be.fulfilled;
      const rt = await this._csale.getRate();
      assert(rt.should.be.bignumber.eq(2000));
      const wi = await this._csale.weiRaised();
      assert(wi.should.be.bignumber.eq(30000000000000000000));
    });
  });
  describe('should reject payments in stage 3 (rate 2000)', function () {
    it('should reject payments over last stage limit (stage 3, rate 2000)', async function () {
      await this._csale.buyTokens(investor, { from: investor, value: _value * 3 }).should.be.fulfilled;
      const rt = await this._csale.getRate();
      const wi = await this._csale.weiRaised();
      assert(rt.should.be.bignumber.eq(2000));
      assert(wi.should.be.bignumber.eq(30000000000000000000));
      await this._csale.buyTokens(investor, { from: investor, value: _value * 1 }).should.be.rejected;
    });
  });
});
