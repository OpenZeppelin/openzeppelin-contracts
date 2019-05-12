const { balance, constants, ether, expectEvent, send, shouldFail } = require('openzeppelin-test-helpers');
const { ZERO_ADDRESS } = constants;

const PaymentSplitter = artifacts.require('PaymentSplitter');

contract('PaymentSplitter', function ([_, owner, payee1, payee2, payee3, nonpayee1, payer1]) {
  const amount = ether('1');

  it('rejects an empty set of payees', async function () {
    await shouldFail.reverting.withMessage(PaymentSplitter.new([], []), 'PaymentSplitter: no payees');
  });

  it('rejects more payees than shares', async function () {
    await shouldFail.reverting.withMessage(PaymentSplitter.new([payee1, payee2, payee3], [20, 30]),
      'PaymentSplitter: payees and shares length mismatch'
    );
  });

  it('rejects more shares than payees', async function () {
    await shouldFail.reverting.withMessage(PaymentSplitter.new([payee1, payee2], [20, 30, 40]),
      'PaymentSplitter: payees and shares length mismatch'
    );
  });

  it('rejects null payees', async function () {
    await shouldFail.reverting.withMessage(PaymentSplitter.new([payee1, ZERO_ADDRESS], [20, 30]),
      'PaymentSplitter: account is the zero address'
    );
  });

  it('rejects zero-valued shares', async function () {
    await shouldFail.reverting.withMessage(PaymentSplitter.new([payee1, payee2], [20, 0]),
      'PaymentSplitter: shares are 0'
    );
  });

  it('rejects repeated payees', async function () {
    await shouldFail.reverting.withMessage(PaymentSplitter.new([payee1, payee1], [20, 30]),
      'PaymentSplitter: account already has shares'
    );
  });

  context('once deployed', function () {
    beforeEach(async function () {
      this.payees = [payee1, payee2, payee3];
      this.shares = [20, 10, 70];

      this.contract = await PaymentSplitter.new(this.payees, this.shares);
    });

    it('should have total shares', async function () {
      (await this.contract.totalShares()).should.be.bignumber.equal('100');
    });

    it('should have payees', async function () {
      await Promise.all(this.payees.map(async (payee, index) => {
        (await this.contract.payee(index)).should.be.equal(payee);
        (await this.contract.released(payee)).should.be.bignumber.equal('0');
      }));
    });

    it('should accept payments', async function () {
      await send.ether(owner, this.contract.address, amount);

      (await balance.current(this.contract.address)).should.be.bignumber.equal(amount);
    });

    it('should store shares if address is payee', async function () {
      (await this.contract.shares(payee1)).should.be.bignumber.not.equal('0');
    });

    it('should not store shares if address is not payee', async function () {
      (await this.contract.shares(nonpayee1)).should.be.bignumber.equal('0');
    });

    it('should throw if no funds to claim', async function () {
      await shouldFail.reverting.withMessage(this.contract.release(payee1),
        'PaymentSplitter: account is not due payment'
      );
    });

    it('should throw if non-payee want to claim', async function () {
      await send.ether(payer1, this.contract.address, amount);
      await shouldFail.reverting.withMessage(this.contract.release(nonpayee1),
        'PaymentSplitter: account has no shares'
      );
    });

    it('should distribute funds to payees', async function () {
      await send.ether(payer1, this.contract.address, amount);

      // receive funds
      const initBalance = await balance.current(this.contract.address);
      initBalance.should.be.bignumber.equal(amount);

      // distribute to payees

      const initAmount1 = await balance.current(payee1);
      const { logs: logs1 } = await this.contract.release(payee1, { gasPrice: 0 });
      const profit1 = (await balance.current(payee1)).sub(initAmount1);
      profit1.should.be.bignumber.equal(ether('0.20'));
      expectEvent.inLogs(logs1, 'PaymentReleased', { to: payee1, amount: profit1 });

      const initAmount2 = await balance.current(payee2);
      const { logs: logs2 } = await this.contract.release(payee2, { gasPrice: 0 });
      const profit2 = (await balance.current(payee2)).sub(initAmount2);
      profit2.should.be.bignumber.equal(ether('0.10'));
      expectEvent.inLogs(logs2, 'PaymentReleased', { to: payee2, amount: profit2 });

      const initAmount3 = await balance.current(payee3);
      const { logs: logs3 } = await this.contract.release(payee3, { gasPrice: 0 });
      const profit3 = (await balance.current(payee3)).sub(initAmount3);
      profit3.should.be.bignumber.equal(ether('0.70'));
      expectEvent.inLogs(logs3, 'PaymentReleased', { to: payee3, amount: profit3 });

      // end balance should be zero
      (await balance.current(this.contract.address)).should.be.bignumber.equal('0');

      // check correct funds released accounting
      (await this.contract.totalReleased()).should.be.bignumber.equal(initBalance);
    });
  });
});
