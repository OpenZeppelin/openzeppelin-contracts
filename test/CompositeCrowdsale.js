import ether from './helpers/ether'
import {advanceBlock} from './helpers/advanceToBlock'
import {increaseTimeTo, duration} from './helpers/increaseTime'
import latestTime from './helpers/latestTime'

const BigNumber = web3.BigNumber

const should = require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should()

const CompositeCrowdsale = artifacts.require('CompositeCrowdsale')
const FixedRateTokenDistribution = artifacts.require('FixedRateTokenDistributionStrategy')
const Token = artifacts.require('ERC20')

const FixedPoolTokenDistribution = artifacts.require('FixedPoolTokenDistributionStrategy')
const SimpleToken = artifacts.require('SimpleToken')

contract('CompositeCrowdsale', function ([_, investor, wallet]) {

  const RATE = new BigNumber(1000);

  before(async function() {
    //Advance to the next block to correctly read time in the solidity "now" function interpreted by testrpc
    await advanceBlock();
  })

  describe('Fixed Rate Distribution', function () {

    beforeEach(async function () {
      this.startTime = latestTime() + duration.weeks(1);
      this.endTime = this.startTime + duration.weeks(1);
      this.afterEndTime = this.endTime + duration.seconds(1);

      this.tokenDistribution = await FixedRateTokenDistribution.new();
      this.crowdsale = await CompositeCrowdsale.new(this.startTime, this.endTime, RATE, wallet, this.tokenDistribution.address)
      this.token = Token.at(await this.tokenDistribution.getToken.call());
    })

    beforeEach(async function () {
      await increaseTimeTo(this.startTime)
    })

    it('should accept payments and mint tokens during the sale', async function () {
      const investmentAmount = ether(1);
      const expectedTokenAmount = RATE.mul(investmentAmount);

      let tx = await this.crowdsale.buyTokens(investor, {value: investmentAmount, from: investor}).should.be.fulfilled;
      console.log("*** COMPOSITION FIXED RATE: " + tx.receipt.gasUsed + " gas used.");

      (await this.token.balanceOf(investor)).should.be.bignumber.equal(expectedTokenAmount);
      (await this.token.totalSupply()).should.be.bignumber.equal(expectedTokenAmount);
    });

  });

  describe('Fixed Pool Distribution', function () {

    beforeEach(async function () {
      this.startTime = latestTime() + duration.weeks(1);
      this.endTime = this.startTime + duration.weeks(1);
      this.afterEndTime = this.endTime + duration.seconds(1);

      const fixedPoolToken = await SimpleToken.new();
      const totalSupply = await fixedPoolToken.totalSupply();
      this.tokenDistribution = await FixedPoolTokenDistribution.new(fixedPoolToken.address);
      await fixedPoolToken.transfer(this.tokenDistribution.address, totalSupply);
      this.crowdsale = await CompositeCrowdsale.new(this.startTime, this.endTime, RATE, wallet, this.tokenDistribution.address)
      this.token = Token.at(await this.tokenDistribution.getToken.call());
    })

    beforeEach(async function () {
      await increaseTimeTo(this.startTime)
    })

    it('should buy tokens and compensate contributors after the sale', async function () {
      const investmentAmount = ether(1);
      let tx = await this.crowdsale.buyTokens(investor, {value: investmentAmount, from: investor}).should.be.fulfilled;
      console.log("*** COMPOSITION FIXED POOL: " + tx.receipt.gasUsed + " gas used.");

      await increaseTimeTo(this.afterEndTime);
      await this.tokenDistribution.compensate(investor).should.be.fulfilled;
      const totalSupply = await this.token.totalSupply();
      (await this.token.balanceOf(investor)).should.be.bignumber.equal(totalSupply);
    })


  });

})
