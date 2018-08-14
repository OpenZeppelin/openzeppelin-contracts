const { ethGetBalance, ethSendTransaction } = require('../helpers/web3');

const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-bignumber')(BigNumber))
  .should();

const { expectThrow } = require('../helpers/expectThrow');
const { EVMRevert } = require('../helpers/EVMRevert.js');
const SplitPayment = artifacts.require('SplitPayment');

contract('SplitPayment', function ([_, owner, payee1, payee2, payee3, nonpayee1, payer1]) {
  const amount = web3.toWei(1.0, 'ether');

  it('cannot be created with no payees', async function () {
    await expectThrow(SplitPayment.new([], []), EVMRevert);
  });

  it('requires shares for each payee', async function () {
    await expectThrow(SplitPayment.new([payee1, payee2, payee3], [20, 30]), EVMRevert);
  });

  it('requires a payee for each share', async function () {
    await expectThrow(SplitPayment.new([payee1, payee2], [20, 30, 40]), EVMRevert);
  });

  context('once deployed', function () {
    beforeEach(async function () {
      this.payees = [payee1, payee2, payee3];
      this.shares = [20, 10, 70];

      this.contract = await SplitPayment.new(this.payees, this.shares);
    });

    it('should accept payments', async function () {
      await ethSendTransaction({ from: owner, to: this.contract.address, value: amount });

      const balance = await ethGetBalance(this.contract.address);
      balance.should.be.bignumber.equal(amount);
    });

    it('should store shares if address is payee', async function () {
      const shares = await this.contract.shares.call(payee1);
      shares.should.be.bignumber.not.eq(0);
    });

    it('should not store shares if address is not payee', async function () {
      const shares = await this.contract.shares.call(nonpayee1);
      shares.should.be.bignumber.equal(0);
    });

    it('should throw if no funds to claim', async function () {
      await expectThrow(this.contract.claim({ from: payee1 }), EVMRevert);
    });

    it('should throw if non-payee want to claim', async function () {
      await ethSendTransaction({ from: payer1, to: this.contract.address, value: amount });
      await expectThrow(this.contract.claim({ from: nonpayee1 }), EVMRevert);
    });

    it('should distribute funds to payees', async function () {
      await ethSendTransaction({ from: payer1, to: this.contract.address, value: amount });

      // receive funds
      const initBalance = await ethGetBalance(this.contract.address);
      initBalance.should.be.bignumber.equal(amount);

      // distribute to payees
      const initAmount1 = await ethGetBalance(payee1);
      await this.contract.claim({ from: payee1 });
      const profit1 = (await ethGetBalance(payee1)).sub(initAmount1);
      profit1.sub(web3.toWei(0.20, 'ether')).abs().should.be.bignumber.lt(1e16);

      const initAmount2 = await ethGetBalance(payee2);
      await this.contract.claim({ from: payee2 });
      const profit2 = (await ethGetBalance(payee2)).sub(initAmount2);
      profit2.sub(web3.toWei(0.10, 'ether')).abs().should.be.bignumber.lt(1e16);

      const initAmount3 = await ethGetBalance(payee3);
      await this.contract.claim({ from: payee3 });
      const profit3 = (await ethGetBalance(payee3)).sub(initAmount3);
      profit3.sub(web3.toWei(0.70, 'ether')).abs().should.be.bignumber.lt(1e16);

      // end balance should be zero
      const endBalance = await ethGetBalance(this.contract.address);
      endBalance.should.be.bignumber.equal(0);

      // check correct funds released accounting
      const totalReleased = await this.contract.totalReleased.call();
      totalReleased.should.be.bignumber.equal(initBalance);
    });
  });
});
