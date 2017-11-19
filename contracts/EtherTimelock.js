const BigNumber = web3.BigNumber

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should()


import latestTime from './helpers/latestTime'
import {increaseTimeTo, duration} from './helpers/increaseTime'
import {advanceBlock} from './helpers/advanceToBlock'
import ether from './helpers/ether'

const EtherTimelock = artifacts.require('EtherTimelock')

contract('EtherTimelock', function ([_, owner, beneficiary]) {

  const FUNDS = ether(1)

  // before(async function() {
  //   //Advance to the next block to correctly read time in the solidity "now" function interpreted by testrpc
  //   await advanceBlock()
  // })

  beforeEach(async function () {
    this.releaseTime = latestTime() + duration.years(1)
    this.timelock = await EtherTimelock.new(beneficiary, this.releaseTime)

    await this.timelock.sendTransaction({value: FUNDS, from: owner})
  })

  it('cannot be released before time limit', async function () {
    await this.timelock.release().should.be.rejected
  })

  it('cannot be released just before time limit', async function () {
    await increaseTimeTo(this.releaseTime - duration.seconds(3))
    await this.timelock.release().should.be.rejected
  })

  it('can be released just after limit', async function () {
    await increaseTimeTo(this.releaseTime + duration.seconds(1))
    await this.timelock.release().should.be.fulfilled
  })

  it('can be released after time limit', async function () {
    await increaseTimeTo(this.releaseTime + duration.years(1))
    await this.timelock.release().should.be.fulfilled
  })

  it('cannot be released twice', async function () {
    await increaseTimeTo(this.releaseTime + duration.years(1))
    await this.timelock.release().should.be.fulfilled
    await this.timelock.release().should.be.rejected
  })

})
