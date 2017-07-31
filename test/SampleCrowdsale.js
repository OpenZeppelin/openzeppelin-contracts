import ether from './helpers/ether'
import advanceToBlock from './helpers/advanceToBlock'
import EVMThrow from './helpers/EVMThrow'

const BigNumber = web3.BigNumber;

const should = require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

const SampleCrowdsale = artifacts.require('SampleCrowdsale');
const SampleCrowdsaleToken = artifacts.require('SampleCrowdsaleToken');

contract('Crowdsale', function ([owner, wallet, investor]) {

  const RATE = new BigNumber(10);
  const GOAL = ether(10);
  const CAP  = ether(20);

  beforeEach(async function () {
    this.startBlock = web3.eth.blockNumber + 10;
    this.endBlock =   web3.eth.blockNumber + 20;

    this.crowdsale = await SampleCrowdsale.new(this.startBlock, this.endBlock, RATE, GOAL, CAP, wallet);
    this.token = SampleCrowdsaleToken.at(await this.crowdsale.token());
  });

  
  it('should create crowdsale with correct parameters', async function () {
    this.crowdsale.should.exist;
    this.token.should.exist;

    (await this.crowdsale.startBlock()).should.be.bignumber.equal(this.startBlock);
    (await this.crowdsale.endBlock()).should.be.bignumber.equal(this.endBlock);
    (await this.crowdsale.rate()).should.be.bignumber.equal(RATE);
    (await this.crowdsale.wallet()).should.be.equal(wallet);
    (await this.crowdsale.goal()).should.be.bignumber.equal(GOAL);
    (await this.crowdsale.cap()).should.be.bignumber.equal(CAP);
  });

  it('should not accept payments before start', async function () {
    await this.crowdsale.send(ether(1)).should.be.rejectedWith(EVMThrow);
    await this.crowdsale.buyTokens(investor, {from: investor, value: ether(1)}).should.be.rejectedWith(EVMThrow);
  });

  it('should accept payments during the sale', async function () {
    const investmentAmount = ether(1);
    const expectedTokenAmount = RATE.mul(investmentAmount);

    await advanceToBlock(this.startBlock - 1);
    await this.crowdsale.buyTokens(investor, {value: investmentAmount, from: investor}).should.be.fulfilled;

    (await this.token.balanceOf(investor)).should.be.bignumber.equal(expectedTokenAmount);
    (await this.token.totalSupply()).should.be.bignumber.equal(expectedTokenAmount);
  });

  it('should reject payments after end', async function () {
    await advanceToBlock(this.endBlock);
    await this.crowdsale.send(ether(1)).should.be.rejectedWith(EVMThrow);
    await this.crowdsale.buyTokens(investor, {value: ether(1), from: investor}).should.be.rejectedWith(EVMThrow);
  });

  it('should reject payments over cap', async function () {
    await advanceToBlock(this.startBlock - 1);
    await this.crowdsale.send(CAP);
    await this.crowdsale.send(1).should.be.rejectedWith(EVMThrow);
  });

  it('should allow finalization and transfer funds to wallet if the goal is reached', async function () {
    await advanceToBlock(this.endBlock - 1);
    await this.crowdsale.send(GOAL);

    const beforeFinalization = web3.eth.getBalance(wallet);
    await this.crowdsale.finalize({from: owner});
    const afterFinalization = web3.eth.getBalance(wallet);

    afterFinalization.minus(beforeFinalization).should.be.bignumber.equal(GOAL);
  });

  it('should allow refunds if the goal is not reached', async function () {
    const balanceBeforeInvestment = web3.eth.getBalance(investor);

    await advanceToBlock(this.startBlock - 1);
    await this.crowdsale.sendTransaction({value: ether(1), from: investor, gasPrice: 0});
    await advanceToBlock(this.endBlock);

    await this.crowdsale.finalize({from: owner});
    await this.crowdsale.claimRefund({from: investor, gasPrice: 0}).should.be.fulfilled;

    const balanceAfterRefund = web3.eth.getBalance(investor);
    balanceBeforeInvestment.should.be.bignumber.equal(balanceAfterRefund);
  });

});
