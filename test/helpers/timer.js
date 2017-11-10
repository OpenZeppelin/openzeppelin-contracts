'use strict';

// timer for tests specific to testrpc
// s is the amount of seconds to advance
// if account is provided, will send a transaction from that account to force testrpc to mine the block
module.exports = (s) => {
  return new Promise((resolve, reject) => {
    web3.currentProvider.sendAsync({
      jsonrpc: '2.0', 
      method: 'evm_increaseTime',
      params: [s], 
      id: new Date().getTime()
    }, function(err) {
      if (err) {
        return reject(err);
      }
      web3.currentProvider.sendAsync({
        jsonrpc: '2.0', 
        method: 'evm_mine',
        id: new Date().getTime()
      }, (err, result) => {
        if (err) {
          return reject(err);
        }
        resolve(result);
      });
    });
  });
};
