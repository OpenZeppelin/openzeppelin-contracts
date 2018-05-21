const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

const EVMThrow = require('../helpers/EVMThrow.js');
const SplitPayment = artifacts.require('SplitPayment');

contract('SplitPayment', function ([owner, payee1, payee2, payee3, nonpayee1, payer1]) {
  const amount = web3.toWei(1.0, 'ether');

  beforeEach(async function () {
    this.payees = [payee1, payee2, payee3];
    this.shares = [20, 10, 70];

    this.contract = await SplitPayment.new();
    await this.contract.initialize(this.payees, this.shares);
  });

  it('should accept payments', async function () {
    await web3.eth.sendTransaction({ from: owner, to: this.contract.address, value: amount });

    const balance = web3.eth.getBalance(this.contract.address);
    balance.should.be.bignumber.equal(amount);
  });

  it('should store shares if address is payee', async function () {
    const shares = await this.contract.shares.call(payee1);
    shares.should.be.bignumber.not.equal(0);
  });

  it('should not store shares if address is not payee', async function () {
    const shares = await this.contract.shares.call(nonpayee1);
    shares.should.be.bignumber.equal(0);
  });

  it('should throw if no funds to claim', async function () {
    await this.contract.claim({ from: payee1 }).should.be.rejectedWith(EVMThrow);
  });

  it('should throw if non-payee want to claim', async function () {
    await web3.eth.sendTransaction({ from: payer1, to: this.contract.address, value: amount });
    await this.contract.claim({ from: nonpayee1 }).should.be.rejectedWith(EVMThrow);
  });

  it('should distribute funds to payees', async function () {
    await web3.eth.sendTransaction({ from: payer1, to: this.contract.address, value: amount });

    // receive funds
    const initBalance = web3.eth.getBalance(this.contract.address);
    initBalance.should.be.bignumber.equal(amount);

    // distribute to payees
    const initAmount1 = web3.eth.getBalance(payee1);
    await this.contract.claim({ from: payee1 });
    const profit1 = web3.eth.getBalance(payee1) - initAmount1;
    assert(Math.abs(profit1 - web3.toWei(0.20, 'ether')) < 1e16);

    const initAmount2 = web3.eth.getBalance(payee2);
    await this.contract.claim({ from: payee2 });
    const profit2 = web3.eth.getBalance(payee2) - initAmount2;
    assert(Math.abs(profit2 - web3.toWei(0.10, 'ether')) < 1e16);

    const initAmount3 = web3.eth.getBalance(payee3);
    await this.contract.claim({ from: payee3 });
    const profit3 = web3.eth.getBalance(payee3) - initAmount3;
    assert(Math.abs(profit3 - web3.toWei(0.70, 'ether')) < 1e16);

    // end balance should be zero
    const endBalance = web3.eth.getBalance(this.contract.address);
    endBalance.should.be.bignumber.equal(0);

    // check correct funds released accounting
    const totalReleased = await this.contract.totalReleased.call();
    totalReleased.should.be.bignumber.equal(initBalance);
  });
});
