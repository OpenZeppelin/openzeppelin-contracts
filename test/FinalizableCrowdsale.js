import advanceToBlock from './helpers/advanceToBlock'
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

  beforeEach(async function () {
    this.startBlock = web3.eth.blockNumber + 10
    this.endBlock = web3.eth.blockNumber + 20

    this.crowdsale = await FinalizableCrowdsale.new(this.startBlock, this.endBlock, rate, wallet, {from: owner})

    this.token = MintableToken.at(await this.crowdsale.token())
  })

  it('cannot be finalized before ending', async function () {
    await this.crowdsale.finalize({from: owner}).should.be.rejectedWith(EVMThrow)
  })

  it('cannot be finalized by third party after ending', async function () {
    await advanceToBlock(this.endBlock)
    await this.crowdsale.finalize({from: thirdparty}).should.be.rejectedWith(EVMThrow)
  })

  it('can be finalized by owner after ending', async function () {
    await advanceToBlock(this.endBlock)
    await this.crowdsale.finalize({from: owner}).should.be.fulfilled
  })

  it('cannot be finalized twice', async function () {
    await advanceToBlock(this.endBlock + 1)
    await this.crowdsale.finalize({from: owner})
    await this.crowdsale.finalize({from: owner}).should.be.rejectedWith(EVMThrow)
  })

  it('logs finalized', async function () {
    await advanceToBlock(this.endBlock)
    const {logs} = await this.crowdsale.finalize({from: owner})
    const event = logs.find(e => e.event === 'Finalized')
    should.exist(event)
  })

  it('finishes minting of token', async function () {
    await advanceToBlock(this.endBlock)
    await this.crowdsale.finalize({from: owner})
    const finished = await this.token.mintingFinished()
    finished.should.equal(true)
  })

})
