import ether from './helpers/ether'
import {advanceBlock} from './helpers/advanceToBlock'
import increaseTime from './helpers/increaseTime'
import {duration, increaseTimeHandicap} from './helpers/increaseTime'
import latestTime from './helpers/latestTime'
import EVMThrow from './helpers/EVMThrow'

const BigNumber = web3.BigNumber

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should()

const RefundableCrowdsale = artifacts.require('./helpers/RefundableCrowdsaleImpl.sol')

contract('RefundableCrowdsale', function ([_, owner, wallet, investor]) {

  const rate = new BigNumber(1000)
  const goal = ether(800)
  const lessThanGoal = ether(750)

  before(async function() {
    //Advance to the next block to correctly read time in the solidity "now" function interpreted by testrpc
    await advanceBlock()
  })

  beforeEach(async function () {
    this.timeToStart = duration.weeks(1);
    this.crowdsalePeriod = duration.weeks(1);
    this.timeToEnd = this.timeToStart + this.crowdsalePeriod + increaseTimeHandicap;

    this.startTime = latestTime().unix() + this.timeToStart;
    this.endTime =   this.startTime + this.crowdsalePeriod;

    this.crowdsale = await RefundableCrowdsale.new(this.startTime, this.endTime, rate, wallet, goal, {from: owner})
  })

  describe('creating a valid crowdsale', function () {

    it('should fail with zero goal', async function () {
      await RefundableCrowdsale.new(this.startTime, this.endTime, rate, wallet, 0, {from: owner}).should.be.rejectedWith(EVMThrow);
    })

  });

  it('should deny refunds before end', async function () {
    await this.crowdsale.claimRefund({from: investor}).should.be.rejectedWith(EVMThrow)
    await increaseTime(this.timeToStart)
    await this.crowdsale.claimRefund({from: investor}).should.be.rejectedWith(EVMThrow)
  })

  it('should deny refunds after end if goal was reached', async function () {
    await increaseTime(this.timeToStart)
    await this.crowdsale.sendTransaction({value: goal, from: investor})
    await increaseTime(this.crowdsalePeriod + increaseTimeHandicap)
    await this.crowdsale.claimRefund({from: investor}).should.be.rejectedWith(EVMThrow)
  })

  it('should allow refunds after end if goal was not reached', async function () {
    await increaseTime(this.timeToStart)
    await this.crowdsale.sendTransaction({value: lessThanGoal, from: investor})
    await increaseTime(this.crowdsalePeriod + increaseTimeHandicap)

    await this.crowdsale.finalize({from: owner})

    const pre = web3.eth.getBalance(investor)
    await this.crowdsale.claimRefund({from: investor, gasPrice: 0})
			.should.be.fulfilled
    const post = web3.eth.getBalance(investor)

    post.minus(pre).should.be.bignumber.equal(lessThanGoal)
  })

  it('should forward funds to wallet after end if goal was reached', async function () {
    await increaseTime(this.timeToStart)
    await this.crowdsale.sendTransaction({value: goal, from: investor})
    await increaseTime(this.crowdsalePeriod + increaseTimeHandicap)

    const pre = web3.eth.getBalance(wallet)
    await this.crowdsale.finalize({from: owner})
    const post = web3.eth.getBalance(wallet)

    post.minus(pre).should.be.bignumber.equal(goal)
  })

})
