const BigNumber = web3.BigNumber

const should = require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should()

const EVMThrow = require('./helpers/EVMThrow.js')
const SplitPullPaymentMock = artifacts.require('./helpers/SplitPullPaymentMock.sol')

contract('SplitPullPayment', function ([owner, payee1, payee2, payee3, nonpayee1, payer1]) {
  const amount = web3.toWei(1.0, 'ether')

  beforeEach(async function () {
    this.payees = [payee1, payee2, payee3]
    this.shares = [20, 10, 70]

    this.contract = await SplitPullPaymentMock.new()
    await this.contract.addPayeeMany(this.payees, this.shares)
  })

  it('should distribute funds to payees', async function () {
    await web3.eth.sendTransaction({from: payer1, to: this.contract.address, value: amount})

    await this.contract.distributeFunds({from: payee1})

    const amount1 = await this.contract.payments.call(payee1)
    amount1.should.be.bignumber.equal(web3.toWei(0.20, 'ether'))

    const amount2 = await this.contract.payments.call(payee2)
    amount2.should.be.bignumber.equal(web3.toWei(0.10, 'ether'))

    const amount3 = await this.contract.payments.call(payee3)
    amount3.should.be.bignumber.equal(web3.toWei(0.70, 'ether'))

    const balance = web3.eth.getBalance(this.contract.address)
    balance.should.be.bignumber.equal(amount)

    const totalPayments = await this.contract.totalPayments.call()
    balance.should.be.bignumber.equal(amount)
  })
})
