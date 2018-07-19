const ether = artifacts.require ('../helpers/ether');
const CapStagedCrowdsale = artifacts.require('CapStagedCrowdsale');
const BigNumber = web3.BigNumber;
const CapStagedCrowdsaleToken = artifacts.require('CapStagedCrowdsaleToken');
require('chai').use(require('chai-as-promised')).use(require('chai-bignumber')(BigNumber)).should();

contract('CapStagedCrowdsale', accounts => {
  const _wallet = accounts[0];
  const _rate = new BigNumber(1000);
  const stage1Limit = 10000000000000000000; //  10ether
  const stage1Rate = new BigNumber(4000);
  const stage2Limit = 20000000000000000000; //  20ether
  const stage2Rate = new BigNumber(3000);
  const stage3Limit = 30000000000000000000; //  30ether
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
    console.log(this._csale.address);
    console.log(this._token.balanceOf(this._csale.address));
  });

  it('getRate', async function () {
    const rt = await this._csale.rate();
    assert.equal(rt, 1000);
  });

  it('should accept payments in stage 1 (rate 4000)', async function () {
    await this._csale.buyTokens(investor, { from: investor, value: ether(10) }).should.be.fulfilled;
    const rt = await this._csale.getRate();
    assert.equal(rt, 4000);
    const wi = await this._csale.weiRaised();
    console.log(rt);
    console.log(wi);
  });

  it('should accept payments in stage 2 (rate 3000)', async function () {
    await this._csale.buyTokens(investor, { from: investor, value: ether(10) }).should.be.fulfilled;
    const rt = await this._csale.getRate();
    assert.equal(rt, 3000);
    const wi = await this._csale.weiRaised();
    console.log(rt);
    console.log(wi);
  });

  it('should accept payments in stage 3 (rate 2000)', async function () {
    await this._csale.buyTokens(investor, { from: investor, value: ether(10) }).should.be.fulfilled;
    const rt = await this._csale.getRate();
    assert.equal(rt, 2000);
    const wi = await this._csale.weiRaised();
    console.log(rt);
    console.log(wi);
  });
   
  it('should reject payments in stage 3 (rate 2000)', async function () {
    const rt = await this._csale.getRate();
    const wi = await this._csale.weiRaised();
    console.log(rt);
    console.log(wi);
    await this._csale.buyTokens(investor, { from: investor, value: ether(10) }).should.be.rejected;
  });
});
