import ether from './helpers/ether'
import EVMThrow from './helpers/EVMThrow'

const BigNumber = web3.BigNumber

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should()

const WhitelistedCrowdsale = artifacts.require('./helpers/WhitelistedCrowdsaleImpl.sol')
const MintableToken = artifacts.require('MintableToken')

contract('WhitelistCrowdsale', function ([_, owner, wallet, beneficiary, sender]) {

  const rate = new BigNumber(1000)

  beforeEach(async function () {
    this.startBlock = web3.eth.blockNumber + 10
    this.endBlock = this.startBlock + 10

    this.crowdsale = await WhitelistedCrowdsale.new(this.startBlock, this.endBlock, rate, wallet, {from: owner})

    this.token = MintableToken.at(await this.crowdsale.token())
  })

  describe('whitelisting', function () {

    const amount = ether(1500)

    it('should add address to whitelist', async function () {
      let whitelisted = await this.crowdsale.isWhitelisted(sender)
      whitelisted.should.equal(false)
      await this.crowdsale.addToWhitelist(sender, {from: owner})
      whitelisted = await this.crowdsale.isWhitelisted(sender)
      whitelisted.should.equal(true)
    })

    it('should reject non-whitelisted sender', async function () {
      await this.crowdsale.buyTokens(beneficiary, {value: amount, from: sender}).should.be.rejectedWith(EVMThrow)
    })

    it('should sell to whitelisted address', async function () {
      await this.crowdsale.addToWhitelist(sender, {from: owner})
      await this.crowdsale.buyTokens(beneficiary, {value: amount, from: sender}).should.be.fulfilled
    })

  })

})
