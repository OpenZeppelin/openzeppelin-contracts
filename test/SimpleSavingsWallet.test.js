const { expectThrow } = require('./helpers/expectThrow');
const { ethGetBalance, ethSendTransaction } = require('./helpers/web3');

const SimpleSavingsWallet = artifacts.require('SimpleSavingsWallet');

contract('SimpleSavingsWallet', function (accounts) {
  let savingsWallet;
  let owner;

  const paymentAmount = 4242;

  beforeEach(async function () {
    savingsWallet = await SimpleSavingsWallet.new(4141);
    owner = await savingsWallet.owner();
  });

  it('should receive funds', async function () {
    await ethSendTransaction({ from: owner, to: savingsWallet.address, value: paymentAmount });
    const balance = await ethGetBalance(savingsWallet.address);
    assert.isTrue((new web3.BigNumber(paymentAmount)).equals(balance));
  });

  it('owner can send funds', async function () {
    // Receive payment so we have some money to spend.
    await ethSendTransaction({ from: accounts[9], to: savingsWallet.address, value: 1000000 });
    await expectThrow(savingsWallet.sendTo(0, paymentAmount, { from: owner }));
    await expectThrow(savingsWallet.sendTo(savingsWallet.address, paymentAmount, { from: owner }));
    await expectThrow(savingsWallet.sendTo(accounts[1], 0, { from: owner }));

    const balance = await ethGetBalance(accounts[1]);
    await savingsWallet.sendTo(accounts[1], paymentAmount, { from: owner });
    const updatedBalance = await ethGetBalance(accounts[1]);
    assert.isTrue(balance.plus(paymentAmount).equals(updatedBalance));
  });
});
