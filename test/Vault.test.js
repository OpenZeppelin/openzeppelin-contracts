import ether from './helpers/ether';
import EVMRevert from './helpers/EVMRevert';
import { increaseTimeTo, duration } from './helpers/increaseTime';
import latestTime from './helpers/latestTime';

const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

const Vault = artifacts.require('Vault');

contract('Vault', function ([_, owner, recovery, sender, recoveryReceiver, newRecovery]) {
  const value = ether(10);

  beforeEach(async function () {
    this.vault = await Vault.new(recovery, duration.days(1), { from: owner });
  });

  it('should accept ether', async function () {
    await this.vault.sendTransaction({ value: value, from: sender }).should.be.fulfilled;
  });

  it('should allow owner to request withdrawal', async function () {
    await this.vault.sendTransaction({ value: value, from: sender }).should.be.fulfilled;
    await this.vault.unvault(value, { from: owner }).should.be.fulfilled;
  });

  it('should allow owner to request withdrawal and withdraw succesfully only after delay', async function () {
    const ownerStartBalance = await web3.eth.getBalance(owner);
    await this.vault.sendTransaction({ value: value, from: sender }).should.be.fulfilled;
    await this.vault.unvault(value, { from: owner, gasPrice: 0 }).should.be.fulfilled;
    const withdrawTime = latestTime() + duration.days(1) + 1;
    await this.vault.withdraw({ from: owner, gasPrice: 0 }).should.be.rejectedWith(EVMRevert);
    await increaseTimeTo(withdrawTime);
    await this.vault.withdraw({ from: owner, gasPrice: 0 }).should.be.fulfilled;
    const ownerFinalBalance = await web3.eth.getBalance(owner);
    ownerFinalBalance.minus(ownerStartBalance).should.be.bignumber.equal(value);
  });

  it('should allow owner to request withdrawal, increase withdrawTime and withdraw succesfully', async function () {
    const ownerStartBalance = await web3.eth.getBalance(owner);
    await this.vault.sendTransaction({ value: value, from: sender }).should.be.fulfilled;
    await this.vault.unvault(value, { from: owner, gasPrice: 0 }).should.be.fulfilled;
    let withdrawTime = latestTime() + duration.days(1);
    await this.vault.lock(duration.days(2), { from: owner, gasPrice: 0 }).should.be.fulfilled;
    withdrawTime = withdrawTime + duration.days(2) + 1;
    await increaseTimeTo(withdrawTime);
    await this.vault.withdraw({ from: owner, gasPrice: 0 }).should.be.fulfilled;
    const ownerFinalBalance = await web3.eth.getBalance(owner);
    ownerFinalBalance.minus(ownerStartBalance).should.be.bignumber.equal(value);
  });

  it('should allow owner to request withdrawal, change amount for lower and withdraw succesfully', async function () {
    const ownerStartBalance = await web3.eth.getBalance(owner);
    await this.vault.sendTransaction({ value: value, from: sender }).should.be.fulfilled;
    await this.vault.unvault(value, { from: owner, gasPrice: 0 }).should.be.fulfilled;
    let withdrawTime = latestTime() + duration.days(1) + 1;
    await this.vault.unvault(ether(5), { from: owner, gasPrice: 0 }).should.be.fulfilled;
    await increaseTimeTo(withdrawTime);
    await this.vault.withdraw({ from: owner, gasPrice: 0 }).should.be.fulfilled;
    const ownerFinalBalance = await web3.eth.getBalance(owner);
    ownerFinalBalance.minus(ownerStartBalance).should.be.bignumber.equal(ether(5));
  });

  it('should allow owner to request withdrawal, increase amount for higher and withdraw succesfully',
    async function () {
      const ownerStartBalance = await web3.eth.getBalance(owner);
      await this.vault.sendTransaction({ value: value, from: sender }).should.be.fulfilled;
      await this.vault.unvault(ether(5), { from: owner, gasPrice: 0 }).should.be.fulfilled;
      let withdrawTime = latestTime() + duration.days(1);
      await this.vault.unvault(value, { from: owner, gasPrice: 0 }).should.be.fulfilled;
      withdrawTime = withdrawTime + duration.days(1) + 1;
      await increaseTimeTo(withdrawTime);
      await this.vault.withdraw({ from: owner, gasPrice: 0 }).should.be.fulfilled;
      const ownerFinalBalance = await web3.eth.getBalance(owner);
      ownerFinalBalance.minus(ownerStartBalance).should.be.bignumber.equal(value);
    });

  it('should allow recovery address to recover funds', async function () {
    const recoveryStartBalance = await web3.eth.getBalance(recoveryReceiver);
    await this.vault.sendTransaction({ value: value, from: sender }).should.be.fulfilled;
    await this.vault.recover(recoveryReceiver, { from: recovery }).should.be.fulfilled;
    const recoveryFinalBalance = await web3.eth.getBalance(recoveryReceiver);
    recoveryFinalBalance.minus(recoveryStartBalance).should.be.bignumber.equal(value);
  });

  it('should allow to change recovery address, reject old one, and recover funds form new one', async function () {
    const recoveryStartBalance = await web3.eth.getBalance(recoveryReceiver);
    await this.vault.sendTransaction({ value: value, from: sender }).should.be.fulfilled;
    await this.vault.changeRecovery(newRecovery, { from: owner }).should.be.fulfilled;
    await this.vault.recover(recoveryReceiver, { from: recovery }).should.be.rejectedWith(EVMRevert);
    await this.vault.recover(recoveryReceiver, { from: newRecovery }).should.be.fulfilled;
    const recoveryFinalBalance = await web3.eth.getBalance(recoveryReceiver);
    recoveryFinalBalance.minus(recoveryStartBalance).should.be.bignumber.equal(value);
  });
});
