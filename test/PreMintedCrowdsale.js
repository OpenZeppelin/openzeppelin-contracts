import ether from './helpers/ether'
import {advanceBlock} from './helpers/advanceToBlock'
import {increaseTimeTo, duration} from './helpers/increaseTime'
import latestTime from './helpers/latestTime'
import EVMRevert from './helpers/EVMRevert'

const BigNumber = web3.BigNumber

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should()

const PreMintedCrowdsale = artifacts.require('PreMintedCrowdsale')
const PreMintedCrowdsaleVault = artifacts.require('PreMintedCrowdsaleVault')
const PseudoMinter = artifacts.require("./token/PseudoMinter.sol");

contract('PreMintedCrowdsale', function ([_, wallet]) {

  const rate = new BigNumber(1000)
  before(async function() {
    //Advance to the next block to correctly read time in the solidity "now" function interpreted by testrpc
    await advanceBlock()
  })

  beforeEach(async function () {
    this.startTime = latestTime() + duration.weeks(1);
    this.endTime =   this.startTime + duration.weeks(1);

    this.vault = await PreMintedCrowdsaleVault.new(this.startTime, this.endTime, rate, wallet)
    this.crowdsale = PreMintedCrowdsale.at(await this.vault.crowdsale())
    this.pseudoMinter = PseudoMinter.at(await this.crowdsale.token())
    this.tokenCap = new BigNumber(await this.pseudoMinter.availableSupply.call())
    this.cap = this.tokenCap.div(rate)
    this.lessThanCap = rate
  })

  describe('accepting payments', function () {

    beforeEach(async function () {
      await increaseTimeTo(this.startTime+ duration.minutes(1))
    })

    it('should accept payments within cap', async function () {
      await this.crowdsale.send(this.cap.minus(this.lessThanCap)).should.be.fulfilled
      await this.crowdsale.send(this.lessThanCap).should.be.fulfilled
    })

    it('should reject payments outside cap', async function () {
      await this.crowdsale.send(this.cap)
      await this.crowdsale.send(1).should.be.rejectedWith(EVMRevert)
    })

    it('should reject payments that exceed cap', async function () {
      await this.crowdsale.send(this.cap.plus(1)).should.be.rejectedWith(EVMRevert)
    })

  })

  describe('ending', function () {

    beforeEach(async function () {
      await increaseTimeTo(this.startTime)
    })

    it('should not be ended if under cap', async function () {
      let hasEnded = await this.crowdsale.hasEnded()
      hasEnded.should.equal(false)
      await this.crowdsale.send(this.lessThanCap)
      hasEnded = await this.crowdsale.hasEnded()
      hasEnded.should.equal(false)
    })

    it('should not be ended if just under cap', async function () {
      await this.crowdsale.send(this.cap.minus(1))
      let hasEnded = await this.crowdsale.hasEnded()
      hasEnded.should.equal(false)
    })

    it('should be ended if cap reached', async function () {
      await this.crowdsale.send(this.cap)
      let hasEnded = await this.crowdsale.hasEnded()
      hasEnded.should.equal(true)
    })

  })

})
