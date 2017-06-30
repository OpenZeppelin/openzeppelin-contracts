'use strict';

var MultisigWalletMock = artifacts.require('./helpers/MultisigWalletMock.sol');
require('./helpers/transactionMined.js');

contract('MultisigWallet', function(accounts) {
  let shouldntFail = function(err) {
    assert.isFalse(!!err);
  };
  it('should send balance to passed address upon death', async function() {
    //Give account[0] 20 ether
    web3.eth.sendTransaction({from: web3.eth.coinbase, to: accounts[0], value: web3.toWei('20','ether')}, shouldntFail);

    let dailyLimit = 10;
    let ownersRequired = 2;

    //Create MultisigWallet contract with 10 ether
    let wallet = await MultisigWalletMock.new(accounts, ownersRequired, dailyLimit, {value: web3.toWei('10', 'ether')});

    //Get balances of owner and wallet after wallet creation.
    let ownerBalance = web3.eth.getBalance(accounts[0]);
    let walletBalance = web3.eth.getBalance(wallet.address);
    let hash = 1234;

    //Call destroy function from two different owner accounts, satisfying owners required
    await wallet.destroy(accounts[0], {data: hash});
    let txnHash = await wallet.destroy(accounts[0], {from: accounts[1], data: hash});

    //Get balances of owner and wallet after destroy function is complete, compare with previous values
    let newOwnerBalance = web3.eth.getBalance(accounts[0]);
    let newWalletBalance = web3.eth.getBalance(wallet.address);

    assert.isTrue(newOwnerBalance > ownerBalance);
    assert.isTrue(newWalletBalance < walletBalance);
  });

  it('should execute transaction if below daily limit', async function() {
    //Give account[0] 20 ether
    web3.eth.sendTransaction({from: web3.eth.coinbase, to: accounts[0], value: web3.toWei('20','ether')}, shouldntFail);

    let dailyLimit = 10;
    let ownersRequired = 2;

    //Create MultisigWallet contract with 10 ether
    let wallet = await MultisigWalletMock.new(accounts, ownersRequired, dailyLimit, {value: web3.toWei('10', 'ether')});

    let accountBalance = web3.eth.getBalance(accounts[2]);
    let hash = 1234;

    //Owner account0 commands wallet to send 9 wei to account2
    let txnHash = await wallet.execute(accounts[2], 9, hash);

    //Balance of account2 should have increased
    let newAccountBalance = web3.eth.getBalance(accounts[2]);
    assert.isTrue(newAccountBalance.greaterThan(accountBalance));
  });

  it('should prevent execution of transaction if above daily limit', async function() {
    //Give account[0] 20 ether
    web3.eth.sendTransaction({from: web3.eth.coinbase, to: accounts[0], value: web3.toWei('20','ether')}, shouldntFail);

    let dailyLimit = 10;
    let ownersRequired = 2;

    //Create MultisigWallet contract with 10 ether
    let wallet = await MultisigWalletMock.new(accounts, ownersRequired, dailyLimit, {value: web3.toWei('10', 'ether')});

    let accountBalance = web3.eth.getBalance(accounts[2]);
    let hash = 1234;

    //Owner account0 commands wallet to send 9 wei to account2
    let txnHash = await wallet.execute(accounts[2], 9, hash);

    //Balance of account2 should have increased
    let newAccountBalance = web3.eth.getBalance(accounts[2]);
    assert.isTrue(newAccountBalance > accountBalance);

    accountBalance = newAccountBalance;
    hash = 4567;

    //Owner account0 commands wallet to send 2 more wei to account2, going over the daily limit of 10
    txnHash = await wallet.execute(accounts[2], 2, hash);

    //Balance of account2 should not change
    newAccountBalance = web3.eth.getBalance(accounts[2]);
    assert.equal(newAccountBalance.toString(), accountBalance.toString());
  });

  it('should execute transaction if above daily limit and enough owners approve', async function() {
    //Give account[0] 20 ether
    web3.eth.sendTransaction({from: web3.eth.coinbase, to: accounts[0], value: web3.toWei('20','ether')}, shouldntFail);

    let dailyLimit = 10;
    let ownersRequired = 2;

    //Create MultisigWallet contract with 10 ether
    let wallet = await MultisigWalletMock.new(accounts, ownersRequired, dailyLimit, {value: web3.toWei('10', 'ether')});

    let accountBalance = web3.eth.getBalance(accounts[2]);
    let hash = 1234;

    //Owner account0 commands wallet to send 11 wei to account2
    let txnHash = await wallet.execute(accounts[2], 11, hash);

    //Balance of account2 should not change
    let newAccountBalance = web3.eth.getBalance(accounts[2]);
    assert.equal(newAccountBalance.toString(), accountBalance.toString());

    accountBalance = newAccountBalance;

    //Owner account1 commands wallet to send 11 wei to account2
    txnHash = await wallet.execute(accounts[2], 2, hash);

    //Balance of account2 should change
    newAccountBalance = web3.eth.getBalance(accounts[2]);
    assert.isTrue(newAccountBalance > accountBalance);
  });

});
