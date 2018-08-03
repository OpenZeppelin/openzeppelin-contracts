const CapStagedCrowdsale = artifacts.require('CapStagedCrowdsale');
const BigNumber = web3.BigNumber;
const CapStagedCrowdsaleToken = artifacts.require('CapStagedCrowdsaleToken');
require('chai').use(require('chai-as-promised')).use(require('chai-bignumber')(BigNumber)).should();

contract('CapStagedCrowdsale', accounts => {
  const _wallet = accounts[0];
  const _rate = new BigNumber(1000);
  const _value =  web3.toWei('10', 'ether');//  10ether
  const stage1Limit = web3.toWei('10', 'ether');//  10ether
  const stage1Rate = new BigNumber(4000);
  const stage2Limit = web3.toWei('20', 'ether');//  10ether //  20ether
  const stage2Rate = new BigNumber(3000);
  const stage3Limit = web3.toWei('30', 'ether');//  10ether//  30ether
  const stage3Rate = new BigNumber(2000);
  const creator = accounts[0];
  const investor = accounts[1];

  it('should create contract', async function () {
    this._token = await CapStagedCrowdsaleToken.new({ from: creator });
    this._csale = await CapStagedCrowdsale.new(_rate, _wallet, this._token.address);
    await this._csale.addStage(stage1Limit, stage1Rate);
    await this._csale.addStage(stage2Limit, stage2Rate);
    await this._csale.addStage(stage3Limit, stage3Rate);
    await this._token.transfer(this._csale.address, 1000000000000000000000000);
    await this._token.transferOwnership(this._csale.address);
  });

  it('getRate', async function () {
    const rt = await this._csale.rate();
    assert.equal(rt, 1000);
  });

  it('should accept payments in stage 1 (rate 4000)', async function () {
    await this._csale.buyTokens(investor, { from: investor, value: _value }).should.be.fulfilled;
    const rt = await this._csale.getRate();
    assert(rt.should.be.bignumber.eq(4000));
    const wi = await this._csale.weiRaised();
    assert(wi.should.be.bignumber.eq(10000000000000000000));
  });

  it('should accept payments in stage 2 (rate 3000)', async function () {
    await this._csale.buyTokens(investor, { from: investor, value: _value }).should.be.fulfilled;
    const rt = await this._csale.getRate();
    assert(rt.should.be.bignumber.eq(3000));
    const wi = await this._csale.weiRaised();
    assert(wi.should.be.bignumber.eq(20000000000000000000));
  });

  it('should accept payments in stage 3 (rate 2000)', async function () {
    await this._csale.buyTokens(investor, { from: investor, value: _value }).should.be.fulfilled;
    const rt = await this._csale.getRate();
    assert(rt.should.be.bignumber.eq(2000));
    const wi = await this._csale.weiRaised();
    assert(wi.should.be.bignumber.eq(30000000000000000000));
  });

  it('should reject payments over last stage limit (stage 3, rate 2000)', async function () {
    const rt = await this._csale.getRate();
    const wi = await this._csale.weiRaised();
    assert(rt.should.be.bignumber.eq(2000));
    assert(wi.should.be.bignumber.eq(30000000000000000000));
    await this._csale.buyTokens(investor, { from: investor, value: _value }).should.be.rejected;
  });
});
