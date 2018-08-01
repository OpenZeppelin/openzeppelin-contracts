// From https://gist.github.com/xavierlepretre/88682e871f4ad07be4534ae560692ee6
function transactionMined (txnHash, interval) {
  interval = interval || 500;
  const transactionReceiptAsync = function (txnHash, resolve, reject) {
    try {
      const receipt = web3.eth.getTransactionReceipt(txnHash);
      if (receipt === null) {
        setTimeout(function () {
          transactionReceiptAsync(txnHash, resolve, reject);
        }, interval);
      } else {
        resolve(receipt);
      }
    } catch (e) {
      reject(e);
    }
  };

  if (Array.isArray(txnHash)) {
    return Promise.all(txnHash.map(hash =>
      web3.eth.getTransactionReceiptMined(hash, interval)
    ));
  } else {
    return new Promise(function (resolve, reject) {
      transactionReceiptAsync(txnHash, resolve, reject);
    });
  }
}

web3.eth.transactionMined = transactionMined;

module.exports = {
  transactionMined,
};
