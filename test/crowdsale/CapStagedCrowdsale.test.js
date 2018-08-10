const CapStagedCrowdsale = artifacts.require('CapStagedCrowdsale');
const BigNumber = web3.BigNumber;
const SimpleToken = artifacts.require('SimpleToken');
require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

contract('CapStagedCrowdsale', function ([_, creator, wallet, investor]) {
  const _rate = new BigNumber(1000);
  const _value = web3.toWei('10', 'ether');//  10ether
  const stage1Limit = web3.toWei('10', 'ether');//  10ether
  const stage1Rate = new BigNumber(40);
  const stage2Limit = web3.toWei('20', 'ether');//  10ether //  20ether
  const stage2Rate = new BigNumber(30);
  const stage3Limit = web3.toWei('30', 'ether');//  10ether//  30ether
  const stage3Rate = new BigNumber(20);
  const stLimits = [stage1Limit, stage2Limit, stage3Limit];
  const stRates = [stage1Rate, stage2Rate, stage3Rate];
  const tokenSupply = new BigNumber(1e+22);
  beforeEach(async function () {
    this._token = await SimpleToken.new();
    this._csale = await CapStagedCrowdsale.new(_rate, wallet, this._token.address, stLimits, stRates);
    await this._token.transfer(this._csale.address, tokenSupply);

  });

  describe('should accept payments in stage 1 (rate 40)', function () {
    it('should accept payments in stage 1 (rate 40)', async function () {
      await this._csale.buyTokens(investor, { from: investor, value: _value }).should.be.fulfilled;
      const rt = await this._csale.getRate();
      assert(rt.should.be.bignumber.eq(40));
      const wi = await this._csale.weiRaised();
      assert(wi.should.be.bignumber.eq(10000000000000000000));
    });
  });
  describe('should accept payments in stage 2 (rate 30)', function () {
    it('should accept payments in stage 2 (rate 30)', async function () {
      await this._csale.buyTokens(investor, { from: investor, value: _value * 2 }).should.be.fulfilled;
      const rt = await this._csale.getRate();
      assert(rt.should.be.bignumber.eq(30));
      const wi = await this._csale.weiRaised();
      assert(wi.should.be.bignumber.eq(20000000000000000000));
    });
  });
  describe('should accept payments in stage 3 (rate 20)', function () {
    it('should accept payments in stage 3 (rate 20)', async function () {
      await this._csale.buyTokens(investor, { from: investor, value: _value * 3 }).should.be.fulfilled;
      const rt = await this._csale.getRate();
      assert(rt.should.be.bignumber.eq(20));
      const wi = await this._csale.weiRaised();
      assert(wi.should.be.bignumber.eq(30000000000000000000));
    });
  });
  describe('should reject payments in stage 3 (rate 20)', function () {
    it('should reject payments over last stage limit (stage 3, rate 20)', async function () {
      await this._csale.buyTokens(investor, { from: investor, value: _value * 3 }).should.be.fulfilled;
      const rt = await this._csale.getRate();
      const wi = await this._csale.weiRaised();
      assert(rt.should.be.bignumber.eq(20));
      assert(wi.should.be.bignumber.eq(30000000000000000000));
      await this._csale.buyTokens(investor, { from: investor, value: _value * 1 }).should.be.rejected;
    });
  });
});
