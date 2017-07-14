import ether from './helpers/ether'
import advanceToBlock from './helpers/advanceToBlock'
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

  describe('creating a valid crowdsale', function () {

    it('should fail with zero goal', async function () {
      await RefundableCrowdsale.new(this.startBlock, this.endBlock, rate, wallet, 0, {from: owner}).should.be.rejectedWith(EVMThrow);
    })

  });


  beforeEach(async function () {
    this.startBlock = web3.eth.blockNumber + 10
    this.endBlock =   web3.eth.blockNumber + 20

    this.crowdsale = await RefundableCrowdsale.new(this.startBlock, this.endBlock, rate, wallet, goal, {from: owner})
  })

  it('should deny refunds before end', async function () {
    await this.crowdsale.claimRefund({from: investor}).should.be.rejectedWith(EVMThrow)
    await advanceToBlock(this.endBlock - 1)
    await this.crowdsale.claimRefund({from: investor}).should.be.rejectedWith(EVMThrow)
  })

  it('should deny refunds after end if goal was reached', async function () {
    await advanceToBlock(this.startBlock - 1)
    await this.crowdsale.sendTransaction({value: goal, from: investor})
    await advanceToBlock(this.endBlock)
    await this.crowdsale.claimRefund({from: investor}).should.be.rejectedWith(EVMThrow)
  })

  it('should allow refunds after end if goal was not reached', async function () {
    await advanceToBlock(this.startBlock - 1)
    await this.crowdsale.sendTransaction({value: lessThanGoal, from: investor})
    await advanceToBlock(this.endBlock)

    await this.crowdsale.finalize({from: owner})

    const pre = web3.eth.getBalance(investor)
    await this.crowdsale.claimRefund({from: investor, gasPrice: 0})
			.should.be.fulfilled
    const post = web3.eth.getBalance(investor)

    post.minus(pre).should.be.bignumber.equal(lessThanGoal)
  })

  it('should forward funds to wallet after end if goal was reached', async function () {
    await advanceToBlock(this.startBlock - 1)
    await this.crowdsale.sendTransaction({value: goal, from: investor})
    await advanceToBlock(this.endBlock)

    const pre = web3.eth.getBalance(wallet)
    await this.crowdsale.finalize({from: owner})
    const post = web3.eth.getBalance(wallet)

    post.minus(pre).should.be.bignumber.equal(goal)
  })

})
