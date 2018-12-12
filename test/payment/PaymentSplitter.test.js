const { ethGetBalance } = require('../helpers/web3');
const expectEvent = require('../helpers/expectEvent');
const send = require('./../helpers/send');
const { ether } = require('../helpers/ether');
const { ZERO_ADDRESS } = require('./../helpers/constants');

require('../helpers/setup');

const shouldFail = require('../helpers/shouldFail');
const PaymentSplitter = artifacts.require('PaymentSplitter');

contract('PaymentSplitter', function ([_, owner, payee1, payee2, payee3, nonpayee1, payer1]) {
  const amount = ether(1.0);

  it('rejects an empty set of payees', async function () {
    await shouldFail.reverting(PaymentSplitter.new([], []));
  });

  it('rejects more payees than shares', async function () {
    await shouldFail.reverting(PaymentSplitter.new([payee1, payee2, payee3], [20, 30]));
  });

  it('rejects more shares than payees', async function () {
    await shouldFail.reverting(PaymentSplitter.new([payee1, payee2], [20, 30, 40]));
  });

  it('rejects null payees', async function () {
    await shouldFail.reverting(PaymentSplitter.new([payee1, ZERO_ADDRESS], [20, 30]));
  });

  it('rejects zero-valued shares', async function () {
    await shouldFail.reverting(PaymentSplitter.new([payee1, payee2], [20, 0]));
  });

  it('rejects repeated payees', async function () {
    await shouldFail.reverting(PaymentSplitter.new([payee1, payee1], [20, 30]));
  });

  context('once deployed', function () {
    beforeEach(async function () {
      this.payees = [payee1, payee2, payee3];
      this.shares = [20, 10, 70];

      this.contract = await PaymentSplitter.new(this.payees, this.shares);
    });

    it('should have total shares', async function () {
      (await this.contract.totalShares()).should.be.bignumber.equal(20 + 10 + 70);
    });

    it('should have payees', async function () {
      await Promise.all(this.payees.map(async (payee, index) => {
        (await this.contract.payee(index)).should.be.equal(payee);
        (await this.contract.released(payee)).should.be.bignumber.equal(0);
      }));
    });

    it('should accept payments', async function () {
      await send.ether(owner, this.contract.address, amount);

      (await ethGetBalance(this.contract.address)).should.be.bignumber.equal(amount);
    });

    it('should store shares if address is payee', async function () {
      (await this.contract.shares(payee1)).should.be.bignumber.not.equal(0);
    });

    it('should not store shares if address is not payee', async function () {
      (await this.contract.shares(nonpayee1)).should.be.bignumber.equal(0);
    });

    it('should throw if no funds to claim', async function () {
      await shouldFail.reverting(this.contract.release(payee1));
    });

    it('should throw if non-payee want to claim', async function () {
      await send.ether(payer1, this.contract.address, amount);
      await shouldFail.reverting(this.contract.release(nonpayee1));
    });

    it('should distribute funds to payees', async function () {
      await send.ether(payer1, this.contract.address, amount);

      // receive funds
      const initBalance = await ethGetBalance(this.contract.address);
      initBalance.should.be.bignumber.equal(amount);

      // distribute to payees
      const initAmount1 = await ethGetBalance(payee1);
      const { logs: logs1 } = await this.contract.release(payee1);
      const profit1 = (await ethGetBalance(payee1)).sub(initAmount1);
      profit1.sub(web3.toWei(0.20, 'ether')).abs().should.be.bignumber.lt(1e16);
      expectEvent.inLogs(logs1, 'PaymentReleased', { to: payee1, amount: profit1 });

      const initAmount2 = await ethGetBalance(payee2);
      const { logs: logs2 } = await this.contract.release(payee2);
      const profit2 = (await ethGetBalance(payee2)).sub(initAmount2);
      profit2.sub(web3.toWei(0.10, 'ether')).abs().should.be.bignumber.lt(1e16);
      expectEvent.inLogs(logs2, 'PaymentReleased', { to: payee2, amount: profit2 });

      const initAmount3 = await ethGetBalance(payee3);
      const { logs: logs3 } = await this.contract.release(payee3);
      const profit3 = (await ethGetBalance(payee3)).sub(initAmount3);
      profit3.sub(web3.toWei(0.70, 'ether')).abs().should.be.bignumber.lt(1e16);
      expectEvent.inLogs(logs3, 'PaymentReleased', { to: payee3, amount: profit3 });

      // end balance should be zero
      (await ethGetBalance(this.contract.address)).should.be.bignumber.equal(0);

      // check correct funds released accounting
      (await this.contract.totalReleased()).should.be.bignumber.equal(initBalance);
    });
  });
});
