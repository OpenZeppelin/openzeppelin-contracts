import ether from './helpers/ether'
import {advanceBlock} from './helpers/advanceToBlock'
import {increaseTimeTo, duration} from './helpers/increaseTime'
import latestTime from './helpers/latestTime'
import EVMThrow from './helpers/EVMThrow'

const BigNumber = web3.BigNumber

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should()

const CappedCrowdsale = artifacts.require('./helpers/CappedCrowdsaleImpl.sol')
const MintableToken = artifacts.require('MintableToken')

contract('CappedCrowdsale', function ([_, wallet]) {

  const rate = new BigNumber(1000)

  const cap = ether(300)
  const lessThanCap = ether(60)

  before(async function() {
    //Advance to the next block to correctly read time in the solidity "now" function interpreted by testrpc
    await advanceBlock()
  })

  beforeEach(async function () {
    this.startTime = latestTime() + duration.weeks(1);
    this.endTime =   this.startTime + duration.weeks(1);

    this.crowdsale = await CappedCrowdsale.new(this.startTime, this.endTime, rate, wallet, cap)

    this.token = MintableToken.at(await this.crowdsale.token())
  })

  describe('creating a valid crowdsale', function () {

    it('should fail with zero cap', async function () {
      await CappedCrowdsale.new(this.startTime, this.endTime, rate, wallet, 0).should.be.rejectedWith(EVMThrow);
    })

  });

  describe('accepting payments', function () {

    beforeEach(async function () {
      await increaseTimeTo(this.startTime)
    })

    it('should accept payments within cap', async function () {
      await this.crowdsale.send(cap.minus(lessThanCap)).should.be.fulfilled
      await this.crowdsale.send(lessThanCap).should.be.fulfilled
    })

    it('should reject payments outside cap', async function () {
      await this.crowdsale.send(cap)
      await this.crowdsale.send(1).should.be.rejectedWith(EVMThrow)
    })

    it('should reject payments that exceed cap', async function () {
      await this.crowdsale.send(cap.plus(1)).should.be.rejectedWith(EVMThrow)
    })

  })

  describe('ending', function () {

    beforeEach(async function () {
      await increaseTimeTo(this.startTime)
    })

    it('should not be ended if under cap', async function () {
      let hasEnded = await this.crowdsale.hasEnded()
      hasEnded.should.equal(false)
      await this.crowdsale.send(lessThanCap)
      hasEnded = await this.crowdsale.hasEnded()
      hasEnded.should.equal(false)
    })

    it('should not be ended if just under cap', async function () {
      await this.crowdsale.send(cap.minus(1))
      let hasEnded = await this.crowdsale.hasEnded()
      hasEnded.should.equal(false)
    })

    it('should be ended if cap reached', async function () {
      await this.crowdsale.send(cap)
      let hasEnded = await this.crowdsale.hasEnded()
      hasEnded.should.equal(true)
    })

  })

})
