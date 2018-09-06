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
  const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

  it('rejects an empty set of payees', async function () {
    await expectThrow(SplitPayment.new([], []), EVMRevert);
  });

  it('rejects more payees than shares', async function () {
    await expectThrow(SplitPayment.new([payee1, payee2, payee3], [20, 30]), EVMRevert);
  });

  it('rejects more shares than payees', async function () {
    await expectThrow(SplitPayment.new([payee1, payee2], [20, 30, 40]), EVMRevert);
  });

  it('rejects null payees', async function () {
    await expectThrow(SplitPayment.new([payee1, ZERO_ADDRESS], [20, 30]), EVMRevert);
  });

  it('rejects zero-valued shares', async function () {
    await expectThrow(SplitPayment.new([payee1, payee2], [20, 0]), EVMRevert);
  });

  it('rejects repeated payees', async function () {
    await expectThrow(SplitPayment.new([payee1, payee1], [20, 30]), EVMRevert);
  });

  context('once deployed', function () {
    beforeEach(async function () {
      this.payees = [payee1, payee2, payee3];
      this.shares = [20, 10, 70];

      this.contract = await SplitPayment.new(this.payees, this.shares);
    });

    it('should have total shares', async function () {
      (await this.contract.totalShares()).should.be.bignumber.equal(20 + 10 + 70);
    });

    it('should have payees', async function () {
      this.payees.forEach(async (payee, index) => {
        (await this.payee(index)).should.be.equal(payee);
        (await this.contract.released(payee)).should.be.bignumber.equal(0);
      });
    });

    it('should accept payments', async function () {
      await ethSendTransaction({ from: owner, to: this.contract.address, value: amount });

      (await ethGetBalance(this.contract.address)).should.be.bignumber.equal(amount);
    });

    it('should store shares if address is payee', async function () {
      (await this.contract.shares(payee1)).should.be.bignumber.not.equal(0);
    });

    it('should not store shares if address is not payee', async function () {
      (await this.contract.shares(nonpayee1)).should.be.bignumber.equal(0);
    });

    it('should throw if no funds to claim', async function () {
      await expectThrow(this.contract.release(payee1), EVMRevert);
    });

    it('should throw if non-payee want to claim', async function () {
      await ethSendTransaction({ from: payer1, to: this.contract.address, value: amount });
      await expectThrow(this.contract.release(nonpayee1), EVMRevert);
    });

    it('should distribute funds to payees', async function () {
      await ethSendTransaction({ from: payer1, to: this.contract.address, value: amount });

      // receive funds
      const initBalance = await ethGetBalance(this.contract.address);
      initBalance.should.be.bignumber.equal(amount);

      // distribute to payees
      const initAmount1 = await ethGetBalance(payee1);
      await this.contract.release(payee1);
      const profit1 = (await ethGetBalance(payee1)).sub(initAmount1);
      profit1.sub(web3.toWei(0.20, 'ether')).abs().should.be.bignumber.lt(1e16);

      const initAmount2 = await ethGetBalance(payee2);
      await this.contract.release(payee2);
      const profit2 = (await ethGetBalance(payee2)).sub(initAmount2);
      profit2.sub(web3.toWei(0.10, 'ether')).abs().should.be.bignumber.lt(1e16);

      const initAmount3 = await ethGetBalance(payee3);
      await this.contract.release(payee3);
      const profit3 = (await ethGetBalance(payee3)).sub(initAmount3);
      profit3.sub(web3.toWei(0.70, 'ether')).abs().should.be.bignumber.lt(1e16);

      // end balance should be zero
      (await ethGetBalance(this.contract.address)).should.be.bignumber.equal(0);

      // check correct funds released accounting
      (await this.contract.totalReleased()).should.be.bignumber.equal(initBalance);
    });
  });
});
