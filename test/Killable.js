
contract('Killable', function(accounts) {
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

  it("should send balance to owner after death", function(done) {
    var initBalance, newBalance, owner, address, killable, kBalance;
    web3.eth.sendTransaction({from: web3.eth.coinbase, to: accounts[0], value: web3.toWei('50','ether')}, function(err, result) {
      if(err)
        console.log("ERROR:" + err);
      else {
        console.log(result);
      }
    })
    return Killable.new({from: accounts[0], value: web3.toWei('10','ether')})
      .then(function(_killable) {
        killable = _killable;
        return killable.owner();
      })
      .then(function(_owner) {
        owner = _owner;
        initBalance = web3.eth.getBalance(owner);
        kBalance = web3.eth.getBalance(killable.address);
      })
      .then(function() {
        return killable.kill({from: owner});
      })
      .then(function (txnHash) {
        return web3.eth.getTransactionReceiptMined(txnHash);
      })
      .then(function() {
        newBalance = web3.eth.getBalance(owner);
      })
      .then(function() {
        assert.isTrue(newBalance > initBalance);
      })
      .then(done);
  });

});
