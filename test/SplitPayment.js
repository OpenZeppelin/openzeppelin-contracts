const BigNumber = web3.BigNumber

const should = require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should()

const EVMThrow = require('./helpers/EVMThrow.js')
const SplitPaymentMock = artifacts.require('./helpers/SplitPaymentMock.sol')

contract('SplitPayment', function ([owner, payee1, payee2, payee3, nonpayee1, payer1]) {
  const amount = web3.toWei(1.0, 'ether')

  beforeEach(async function () {
    this.payees = [payee1, payee2, payee3]
    this.shares = [20, 10, 70]

    this.contract = await SplitPaymentMock.new()
    await this.contract.addPayeeMany(this.payees, this.shares)
  })

  it('should accept payments', async function () {
    await web3.eth.sendTransaction({ from: owner, to: this.contract.address, value: amount })

    const balance = web3.eth.getBalance(this.contract.address)
    balance.should.be.bignumber.equal(amount)
  })

  it('should return if address is payee', async function () {
    const isPayee = await this.contract.isPayee.call(payee1)
    isPayee.should.equal(true)
  })

  it('should return if address is not payee', async function () {
    const isPayee = await this.contract.isPayee.call(nonpayee1)
    isPayee.should.equal(false)
  })

  it('should return the correct payee by address', async function () {
    const payeeIdx = 0
    const [payee, shares] = await this.contract.getPayee.call(this.payees[payeeIdx])
    payee.should.be.equal(payee1)
    shares.should.be.bignumber.equal(this.shares[payeeIdx])
  })

  it('should return the correct payee by index', async function () {
    const payeeIdx = 1
    const [payee, shares] = await this.contract.getPayeeAtIndex.call(payeeIdx)
    payee.should.be.equal(payee2)
    shares.should.be.bignumber.equal(this.shares[payeeIdx])
  })

  it('should throw if payees and shares array have different sizes', async function () {
    const payees = [payee1, payee2, payee3]
    const shares = [50, 50]
    await this.contract.addPayeeMany(payees, shares).should.be.rejectedWith(EVMThrow)
  })

  it('should throw if try to add same payee multiple times', async function () {
    const payees = [payee1, payee1]
    const shares = [50, 50]
    await this.contract.addPayeeMany(payees, shares).should.be.rejectedWith(EVMThrow)
  })

  it('should throw if try to add payee with zero shares', async function () {
    await this.contract.addPayee(nonpayee1, 0).should.be.rejectedWith(EVMThrow)
  })

  it('should throw if no funds to distribute', async function () {
    await this.contract.distributeFunds({from: payee1}).should.be.rejectedWith(EVMThrow)
  })

  it('should distribute funds to payees', async function () {
    await web3.eth.sendTransaction({from: payer1, to: this.contract.address, value: amount})

    const initBalance = web3.eth.getBalance(this.contract.address)
    initBalance.should.be.bignumber.equal(amount)

    const initAmount1 = web3.eth.getBalance(payee1)
    const initAmount2 = web3.eth.getBalance(payee2)
    const initAmount3 = web3.eth.getBalance(payee3)

    await this.contract.distributeFunds({from: payee1})

    // Contract should have zero balance after distribution
    const afterBalance = web3.eth.getBalance(this.contract.address)
    afterBalance.should.be.bignumber.equal(0)

    const profit1 = web3.eth.getBalance(payee1) - initAmount1
    const profit2 = web3.eth.getBalance(payee2) - initAmount2
    const profit3 = web3.eth.getBalance(payee3) - initAmount3

    assert(Math.abs(profit1 - web3.toWei(0.20, 'ether')) < 1e16);
    assert(Math.abs(profit2 - web3.toWei(0.10, 'ether')) < 1e16);
    assert(Math.abs(profit3 - web3.toWei(0.70, 'ether')) < 1e16);
  })

  it('should throw if non-payee want to distribute funds', async function () {
    await web3.eth.sendTransaction({from: payer1, to: this.contract.address, value: amount})
    await this.contract.distributeFunds({from: nonpayee1}).should.be.rejectedWith(EVMThrow)
  })
})
