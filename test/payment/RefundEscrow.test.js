import EVMRevert from '../helpers/EVMRevert';
import expectEvent from '../helpers/expectEvent';

const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-bignumber')(BigNumber))
  .should();

const RefundEscrow = artifacts.require('RefundEscrow');

contract('RefundEscrow', function ([owner, beneficiary, refundee1, refundee2]) {
  const amount = web3.toWei(54.0, 'ether');
  const refundees = [refundee1, refundee2];

  beforeEach(async function () {
    this.escrow = await RefundEscrow.new(beneficiary, { from: owner });
  });

  context('active state', function () {
    it('accepts deposits', async function () {
      await this.escrow.deposit(refundee1, { from: owner, value: amount });

      const deposit = await this.escrow.depositsOf(refundee1);
      deposit.should.be.bignumber.equal(amount);
    });

    it('does not refund refundees', async function () {
      await this.escrow.deposit(refundee1, { from: owner, value: amount });
      await this.escrow.withdraw(refundee1).should.be.rejectedWith(EVMRevert);
    });

    it('does not allow beneficiary withdrawal', async function () {
      await this.escrow.deposit(refundee1, { from: owner, value: amount });
      await this.escrow.beneficiaryWithdraw().should.be.rejectedWith(EVMRevert);
    });
  });

  it('only owner can enter closed state', async function () {
    await this.escrow.close({ from: beneficiary }).should.be.rejectedWith(EVMRevert);

    const receipt = await this.escrow.close({ from: owner });

    await expectEvent.inLogs(receipt.logs, 'Closed');
  });

  context('closed state', function () {
    beforeEach(async function () {
      await Promise.all(refundees.map(refundee => this.escrow.deposit(refundee, { from: owner, value: amount })));

      await this.escrow.close({ from: owner });
    });

    it('rejects deposits', async function () {
      await this.escrow.deposit(refundee1, { from: owner, value: amount }).should.be.rejectedWith(EVMRevert);
    });

    it('does not refund refundees', async function () {
      await this.escrow.withdraw(refundee1).should.be.rejectedWith(EVMRevert);
    });

    it('allows beneficiary withdrawal', async function () {
      const beneficiaryInitialBalance = await web3.eth.getBalance(beneficiary);
      await this.escrow.beneficiaryWithdraw();
      const beneficiaryFinalBalance = await web3.eth.getBalance(beneficiary);

      beneficiaryFinalBalance.sub(beneficiaryInitialBalance).should.be.bignumber.equal(amount * refundees.length);
    });
  });

  it('only owner can enter refund state', async function () {
    await this.escrow.enableRefunds({ from: beneficiary }).should.be.rejectedWith(EVMRevert);

    const receipt = await this.escrow.enableRefunds({ from: owner });

    await expectEvent.inLogs(receipt.logs, 'RefundsEnabled');
  });

  context('refund state', function () {
    beforeEach(async function () {
      await Promise.all(refundees.map(refundee => this.escrow.deposit(refundee, { from: owner, value: amount })));

      await this.escrow.enableRefunds({ from: owner });
    });

    it('rejects deposits', async function () {
      await this.escrow.deposit(refundee1, { from: owner, value: amount }).should.be.rejectedWith(EVMRevert);
    });

    it('refunds refundees', async function () {
      for (let refundee of [refundee1, refundee2]) {
        const refundeeInitialBalance = await web3.eth.getBalance(refundee);
        await this.escrow.withdraw(refundee);
        const refundeeFinalBalance = await web3.eth.getBalance(refundee);

        refundeeFinalBalance.sub(refundeeInitialBalance).should.be.bignumber.equal(amount);
      }
    });

    it('does not allow beneficiary withdrawal', async function () {
      await this.escrow.beneficiaryWithdraw().should.be.rejectedWith(EVMRevert);
    });
  });
});
