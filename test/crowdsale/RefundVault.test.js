import ether from '../helpers/ether';
import EVMRevert from '../helpers/EVMRevert';

const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

const RefundVault = artifacts.require('RefundVault');

contract('RefundVault', function ([_, owner, wallet, investor]) {
  const value = ether(42);

  beforeEach(async function () {
    this.vault = await RefundVault.new(wallet, { from: owner });
  });

  it('should accept contributions', async function () {
    await this.vault.deposit(investor, { value, from: owner }).should.be.fulfilled;
  });

  it('should not refund contribution during active state', async function () {
    await this.vault.deposit(investor, { value, from: owner });
    await this.vault.refund(investor).should.be.rejectedWith(EVMRevert);
  });

  it('only owner can enter refund mode', async function () {
    await this.vault.enableRefunds({ from: _ }).should.be.rejectedWith(EVMRevert);
    await this.vault.enableRefunds({ from: owner }).should.be.fulfilled;
  });

  it('should refund contribution after entering refund mode', async function () {
    await this.vault.deposit(investor, { value, from: owner });
    await this.vault.enableRefunds({ from: owner });

    const pre = web3.eth.getBalance(investor);
    await this.vault.refund(investor);
    const post = web3.eth.getBalance(investor);

    post.minus(pre).should.be.bignumber.equal(value);
  });

  it('only owner can close', async function () {
    await this.vault.close({ from: _ }).should.be.rejectedWith(EVMRevert);
    await this.vault.close({ from: owner }).should.be.fulfilled;
  });

  it('should forward funds to wallet after closing', async function () {
    await this.vault.deposit(investor, { value, from: owner });

    const pre = web3.eth.getBalance(wallet);
    await this.vault.close({ from: owner });
    const post = web3.eth.getBalance(wallet);

    post.minus(pre).should.be.bignumber.equal(value);
  });
});
