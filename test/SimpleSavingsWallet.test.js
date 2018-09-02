const { expectThrow } = require('./helpers/expectThrow');
const { ethGetBalance, ethSendTransaction } = require('./helpers/web3');

const SimpleSavingsWallet = artifacts.require('SimpleSavingsWallet');

const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-bignumber')(BigNumber))
  .should();

contract('SimpleSavingsWallet', function ([_, owner, anyone]) {
  let savingsWallet;

  const paymentAmount = 4242;

  beforeEach(async function () {
    savingsWallet = await SimpleSavingsWallet.new(4141, { from: owner });
  });

  it('should receive funds', async function () {
    await ethSendTransaction({ from: owner, to: savingsWallet.address, value: paymentAmount });
    const balance = await ethGetBalance(savingsWallet.address);
    balance.should.be.bignumber.equal(paymentAmount);
  });

  it('owner can send funds', async function () {
    // Receive payment so we have some money to spend.
    await ethSendTransaction({ from: anyone, to: savingsWallet.address, value: 1000000 });

    await expectThrow(savingsWallet.sendTo(0, paymentAmount, { from: owner }));
    await expectThrow(savingsWallet.sendTo(savingsWallet.address, paymentAmount, { from: owner }));
    await expectThrow(savingsWallet.sendTo(anyone, 0, { from: owner }));

    const balance = await ethGetBalance(anyone);
    await savingsWallet.sendTo(anyone, paymentAmount, { from: owner });
    const updatedBalance = await ethGetBalance(anyone);
    balance.plus(paymentAmount).should.be.bignumber.equal(updatedBalance);
  });
});
