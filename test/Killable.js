
contract('Killable', function(accounts) {
  //from https://gist.github.com/xavierlepretre/88682e871f4ad07be4534ae560692ee6
  web3.eth.getTransactionReceiptMined = function (txnHash, interval) {
    var transactionReceiptAsync;
    interval = interval ? interval : 500;
    transactionReceiptAsync = function(txnHash, resolve, reject) {
        try {
            var receipt = web3.eth.getTransactionReceipt(txnHash);
            if (receipt === null) {
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

  it("should send balance to owner after death", async function() {
    let initBalance, newBalance, owner, address, killable, kBalance, txnHash, receiptMined;
    web3.eth.sendTransaction({from: web3.eth.coinbase, to: accounts[0], value: web3.toWei('50','ether')}, function(err, result) {
      if(err)
        console.log("ERROR:" + err);
    });

    killable = await Killable.new({from: accounts[0], value: web3.toWei('10','ether')});
    owner = await killable.owner();
    initBalance = web3.eth.getBalance(owner);
    kBalance = web3.eth.getBalance(killable.address);
    txnHash = await killable.kill({from: owner});
    receiptMined = await web3.eth.getTransactionReceiptMined(txnHash);
    newBalance = web3.eth.getBalance(owner);

    assert.isTrue(newBalance > initBalance);
  });

});
