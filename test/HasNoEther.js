'use strict';
import expectThrow from './helpers/expectThrow';
import toPromise from './helpers/toPromise';
const HasNoEther = artifacts.require('../contracts/lifecycle/HasNoEther.sol');
const HasNoEtherTest = artifacts.require('../helpers/HasNoEtherTest.sol');
const ForceEther = artifacts.require('../helpers/ForceEther.sol');

contract('HasNoEther', function(accounts) {
  const amount = web3.toWei('1', 'ether');

  it('should be constructorable', async function() {
    let hasNoEther = await HasNoEtherTest.new();
  });

  it('should not accept ether in constructor', async function() {
    await expectThrow(HasNoEtherTest.new({value: amount}));
  });

  it('should not accept ether', async function() {
    let hasNoEther = await HasNoEtherTest.new();

    await expectThrow(
      toPromise(web3.eth.sendTransaction)({
        from: accounts[1],
        to: hasNoEther.address,
        value: amount,
      }),
    );
  });

  it('should allow owner to reclaim ether', async function() {
    // Create contract
    let hasNoEther = await HasNoEtherTest.new();
    const startBalance = await web3.eth.getBalance(hasNoEther.address);
    assert.equal(startBalance, 0);

    // Force ether into it
    let forceEther = await ForceEther.new({value: amount});
    await forceEther.destroyAndSend(hasNoEther.address);
    const forcedBalance = await web3.eth.getBalance(hasNoEther.address);
    assert.equal(forcedBalance, amount);

    // Reclaim
    const ownerStartBalance = await web3.eth.getBalance(accounts[0]);
    await hasNoEther.reclaimEther();
    const ownerFinalBalance = await web3.eth.getBalance(accounts[0]);
    const finalBalance = await web3.eth.getBalance(hasNoEther.address);
    assert.equal(finalBalance, 0);
    assert.isAbove(ownerFinalBalance, ownerStartBalance);
  });

  it('should allow only owner to reclaim ether', async function() {
    // Create contract
    let hasNoEther = await HasNoEtherTest.new({from: accounts[0]});

    // Force ether into it
    let forceEther = await ForceEther.new({value: amount});
    await forceEther.destroyAndSend(hasNoEther.address);
    const forcedBalance = await web3.eth.getBalance(hasNoEther.address);
    assert.equal(forcedBalance, amount);

    // Reclaim
    await expectThrow(hasNoEther.reclaimEther({from: accounts[1]}));
  });
});
