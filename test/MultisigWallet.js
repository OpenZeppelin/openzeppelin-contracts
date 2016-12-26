contract('MultisigWallet', function(accounts) {
  //from https://gist.github.com/xavierlepretre/88682e871f4ad07be4534ae560692ee6
  web3.eth.getTransactionReceiptMined = function (txnHash, interval) {
    var transactionReceiptAsync;
    interval = interval ? interval : 500;
    transactionReceiptAsync = function(txnHash, resolve, reject) {
        try {
            var receipt = web3.eth.getTransactionReceipt(txnHash);
            if (receipt == null) {
                setTimeout(function () {
                    transactionReceiptAsync(txnHash, resolve, reject);
                }, interval);
            } else {
                resolve(receipt);
            }
        } catch(e) {
            reject(e);
        }
    };

    if (Array.isArray(txnHash)) {
        var promises = [];
        txnHash.forEach(function (oneTxHash) {
            promises.push(web3.eth.getTransactionReceiptMined(oneTxHash, interval));
        });
        return Promise.all(promises);
    } else {
        return new Promise(function (resolve, reject) {
                transactionReceiptAsync(txnHash, resolve, reject);
            });
    }
};


  it('should send balance to passed address upon death', async function() {
    //Give account[0] 20 ether
    web3.eth.sendTransaction({from: web3.eth.coinbase, to: accounts[0], value: web3.toWei('20','ether')}, function(err, result) {
      if(err)
        console.log("ERROR:" + err);
    });

    let dailyLimit = 10;
    let ownersRequired = 2;

    //Create MultisigWallet contract with 10 ether
    let wallet = await MultisigWalletMock.new(accounts, ownersRequired, dailyLimit, {value: web3.toWei('10', 'ether')});

    //Get balances of owner and wallet after wallet creation.
    let ownerBalance = web3.eth.getBalance(accounts[0]);
    let walletBalance = web3.eth.getBalance(wallet.address);
    let hash = 1234;

    //Call kill function from two different owner accounts, satisfying owners required
    await wallet.kill(accounts[0], {data: hash});
    let txnHash = await wallet.kill(accounts[0], {from: accounts[1], data: hash});

    let receiptMined = await web3.eth.getTransactionReceiptMined(txnHash);

    //Get balances of owner and wallet after kill function is complete, compare with previous values
    let newOwnerBalance = web3.eth.getBalance(accounts[0]);
    let newWalletBalance = web3.eth.getBalance(wallet.address);

    assert.isTrue(newOwnerBalance > ownerBalance);
    assert.isTrue(newWalletBalance < walletBalance);
  });

  it('should execute transaction if below daily limit', async function() {
    //Give account[0] 20 ether
    web3.eth.sendTransaction({from: web3.eth.coinbase, to: accounts[0], value: web3.toWei('20','ether')}, function(err, result) {
      if(err)
        console.log("ERROR:" + err);
    });

    let dailyLimit = 10;
    let ownersRequired = 2;

    //Create MultisigWallet contract with 10 ether
    let wallet = await MultisigWalletMock.new(accounts, ownersRequired, dailyLimit, {value: web3.toWei('10', 'ether')});

    let accountBalance = web3.eth.getBalance(accounts[2]);
    let hash = 1234;

    //Owner account0 commands wallet to send 9 wei to account2
    let txnHash = await wallet.execute(accounts[2], 9, hash);
    let receiptMined = await web3.eth.getTransactionReceiptMined(txnHash);

    //Balance of account2 should have increased
    let newAccountBalance = web3.eth.getBalance(accounts[2]);
    assert.isTrue(newAccountBalance > accountBalance);
  });

  it('should prevent execution of transaction if above daily limit', async function() {
    //Give account[0] 20 ether
    web3.eth.sendTransaction({from: web3.eth.coinbase, to: accounts[0], value: web3.toWei('20','ether')}, function(err, result) {
      if(err)
        console.log("ERROR:" + err);
    });

    let dailyLimit = 10;
    let ownersRequired = 2;

    //Create MultisigWallet contract with 10 ether
    let wallet = await MultisigWalletMock.new(accounts, ownersRequired, dailyLimit, {value: web3.toWei('10', 'ether')});

    let accountBalance = web3.eth.getBalance(accounts[2]);
    let hash = 1234;

    //Owner account0 commands wallet to send 9 wei to account2
    let txnHash = await wallet.execute(accounts[2], 9, hash);
    let receiptMined = await web3.eth.getTransactionReceiptMined(txnHash);

    //Balance of account2 should have increased
    let newAccountBalance = web3.eth.getBalance(accounts[2]);
    assert.isTrue(newAccountBalance > accountBalance);

    accountBalance = newAccountBalance;
    hash = 4567;

    //Owner account0 commands wallet to send 2 more wei to account2, going over the daily limit of 10
    txnHash = await wallet.execute(accounts[2], 2, hash);
    receiptMined = await web3.eth.getTransactionReceiptMined(txnHash);

    //Balance of account2 should not change
    newAccountBalance = web3.eth.getBalance(accounts[2]);
    assert.equal(newAccountBalance.toString(), accountBalance.toString());
  });

  it('should execute transaction if above daily limit and enough owners approve', async function() {
    //Give account[0] 20 ether
    web3.eth.sendTransaction({from: web3.eth.coinbase, to: accounts[0], value: web3.toWei('20','ether')}, function(err, result) {
      if(err)
        console.log("ERROR:" + err);
    });

    let dailyLimit = 10;
    let ownersRequired = 2;

    //Create MultisigWallet contract with 10 ether
    let wallet = await MultisigWalletMock.new(accounts, ownersRequired, dailyLimit, {value: web3.toWei('10', 'ether')});

    let accountBalance = web3.eth.getBalance(accounts[2]);
    let hash = 1234;

    //Owner account0 commands wallet to send 11 wei to account2
    let txnHash = await wallet.execute(accounts[2], 11, hash);
    let receiptMined = await web3.eth.getTransactionReceiptMined(txnHash);

    //Balance of account2 should not change
    let newAccountBalance = web3.eth.getBalance(accounts[2]);
    assert.equal(newAccountBalance.toString(), accountBalance.toString());

    accountBalance = newAccountBalance;

    //Owner account1 commands wallet to send 11 wei to account2
    txnHash = await wallet.execute(accounts[2], 2, hash);
    receiptMined = await web3.eth.getTransactionReceiptMined(txnHash);

    //Balance of account2 should change
    newAccountBalance = web3.eth.getBalance(accounts[2]);
    assert.isTrue(newAccountBalance > accountBalance);
  });

});
