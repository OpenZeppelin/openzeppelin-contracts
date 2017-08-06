import moment from 'moment'
import advanceToBlock from './helpers/advanceToBlock'
import increaseTime from './helpers/increaseTime'
import latestTime from './helpers/latestTime'
import EVMThrow from './helpers/EVMThrow'

const BigNumber = web3.BigNumber

const should = require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should()

const FinalizableCrowdsale = artifacts.require('./helpers/FinalizableCrowdsaleImpl.sol')
const MintableToken = artifacts.require('MintableToken')

contract('FinalizableCrowdsale', function ([_, owner, wallet, thirdparty]) {

  const rate = new BigNumber(1000)

  before(async function() {
    //Advance to the next block to correctly read time in the solidity "now" function interpreted by testrpc
    await advanceToBlock(web3.eth.getBlock('latest').number + 1)
  })

  beforeEach(async function () {
    this.startTime = latestTime().unix() + moment.duration(1, 'week').asSeconds();
    this.endTime =   latestTime().unix() + moment.duration(2, 'week').asSeconds();

    this.crowdsale = await FinalizableCrowdsale.new(this.startTime, this.endTime, rate, wallet, {from: owner})

    this.token = MintableToken.at(await this.crowdsale.token())
  })

  it('cannot be finalized before ending', async function () {
    await this.crowdsale.finalize({from: owner}).should.be.rejectedWith(EVMThrow)
  })

  it('cannot be finalized by third party after ending', async function () {
    await increaseTime(moment.duration(2.1, 'week'))
    await this.crowdsale.finalize({from: thirdparty}).should.be.rejectedWith(EVMThrow)
  })

  it('can be finalized by owner after ending', async function () {
    await increaseTime(moment.duration(2.1, 'week'))
    await this.crowdsale.finalize({from: owner}).should.be.fulfilled
  })

  it('cannot be finalized twice', async function () {
    await increaseTime(moment.duration(2.1, 'week'))
    await this.crowdsale.finalize({from: owner})
    await this.crowdsale.finalize({from: owner}).should.be.rejectedWith(EVMThrow)
  })

  it('logs finalized', async function () {
    await increaseTime(moment.duration(2.1, 'week'))
    const {logs} = await this.crowdsale.finalize({from: owner})
    const event = logs.find(e => e.event === 'Finalized')
    should.exist(event)
  })

  it('finishes minting of token', async function () {
    await increaseTime(moment.duration(2.1, 'week'))
    await this.crowdsale.finalize({from: owner})
    const finished = await this.token.mintingFinished()
    finished.should.equal(true)
  })

})
