import EVMRevert from '../helpers/EVMRevert';

const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-bignumber')(BigNumber))
  .should();

const RefundableEscrow = artifacts.require('RefundableEscrow');

contract('RefundableEscrow', function ([owner, beneficiary, investor1, investor2]) {
  const amount = web3.toWei(54.0, 'ether');
  const investors = [investor1, investor2];

  beforeEach(async function () {
    this.contract = await RefundableEscrow.new(beneficiary);
  });

  it('disallows direct deposits', async function () {
    await this.contract.deposit(investor1, { from: investor1, value: amount }).should.be.rejectedWith(EVMRevert);
  });

  context('active state', function () {
    it('accepts investments', async function () {
      await this.contract.invest({ from: investor1, value: amount });

      const investment = await this.contract.deposits(investor1);
      investment.should.be.bignumber.equal(amount);
    });

    it('does not refund investors', async function () {
      await this.contract.invest({ from: investor1, value: amount });
      await this.contract.withdraw(investor1).should.be.rejectedWith(EVMRevert);
    });

    it('does not allow beneficiary withdrawal', async function () {
      await this.contract.invest({ from: investor1, value: amount });
      await this.contract.withdraw(beneficiary).should.be.rejectedWith(EVMRevert);
    });
  });

  it('only owner can enter closed state', async function () {
    await this.contract.close({ from: beneficiary }).should.be.rejectedWith(EVMRevert);

    const receipt = await this.contract.close({ from: owner });

    receipt.logs.length.should.equal(1);
    receipt.logs[0].event.should.equal('Closed');
  });

  context('closed state', function () {
    beforeEach(async function () {
      await Promise.all(investors.map(investor => this.contract.invest({ from: investor, value: amount })));

      await this.contract.close({ from: owner });
    });

    it('rejects investments', async function () {
      await this.contract.invest({ from: investor1, value: amount }).should.be.rejectedWith(EVMRevert);
    });

    it('does not refund investors', async function () {
      await this.contract.withdraw(investor1).should.be.rejectedWith(EVMRevert);
    });

    it('allows beneficiary withdrawal', async function () {
      const beneficiaryInitialBalance = await web3.eth.getBalance(beneficiary);
      await this.contract.withdraw(beneficiary);
      const beneficiaryFinalBalance = await web3.eth.getBalance(beneficiary);

      beneficiaryFinalBalance.sub(beneficiaryInitialBalance).should.be.bignumber.equal(amount * investors.length);
    });
  });

  it('only owner can enter refund state', async function () {
    await this.contract.enableRefunds({ from: beneficiary }).should.be.rejectedWith(EVMRevert);

    const receipt = await this.contract.enableRefunds({ from: owner });

    receipt.logs.length.should.equal(1);
    receipt.logs[0].event.should.equal('RefundsEnabled');
  });

  context('refund state', function () {
    beforeEach(async function () {
      await Promise.all(investors.map(investor => this.contract.invest({ from: investor, value: amount })));

      await this.contract.enableRefunds({ from: owner });
    });

    it('rejects investments', async function () {
      await this.contract.invest({ from: investor1, value: amount }).should.be.rejectedWith(EVMRevert);
    });

    it('refunds investors', async function () {
      for (let investor of [investor1, investor2]) {
        const investorInitialBalance = await web3.eth.getBalance(investor);
        await this.contract.withdraw(investor);
        const investorFinalBalance = await web3.eth.getBalance(investor);

        investorFinalBalance.sub(investorInitialBalance).should.be.bignumber.equal(amount);
      }
    });

    it('does not allow beneficiary withdrawal', async function () {
      await this.contract.withdraw(beneficiary).should.be.rejectedWith(EVMRevert);
    });
  });
});
