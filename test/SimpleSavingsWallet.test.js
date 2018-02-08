
import expectThrow from './helpers/expectThrow';

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
    await web3.eth.sendTransaction({ from: owner, to: savingsWallet.address, value: paymentAmount });
    assert.isTrue((new web3.BigNumber(paymentAmount)).equals(web3.eth.getBalance(savingsWallet.address)));
  });

  it('owner can send funds', async function () {
    // Receive payment so we have some money to spend.
    await web3.eth.sendTransaction({ from: accounts[9], to: savingsWallet.address, value: 1000000 });
    await expectThrow(savingsWallet.sendTo(0, paymentAmount, { from: owner }));
    await expectThrow(savingsWallet.sendTo(savingsWallet.address, paymentAmount, { from: owner }));
    await expectThrow(savingsWallet.sendTo(accounts[1], 0, { from: owner }));

    const balance = web3.eth.getBalance(accounts[1]);
    await savingsWallet.sendTo(accounts[1], paymentAmount, { from: owner });
    assert.isTrue(balance.plus(paymentAmount).equals(web3.eth.getBalance(accounts[1])));
  });
});
