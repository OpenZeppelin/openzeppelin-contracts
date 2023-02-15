const { time } = require('@openzeppelin/test-helpers');

module.exports = {
  clock: {
    blocknumber: () => web3.eth.getBlock('latest').then(block => block.number),
    timestamp: () => web3.eth.getBlock('latest').then(block => block.timestamp),
  },
  clockFromReceipt: {
    blocknumber: receipt => Promise.resolve(receipt.blockNumber),
    timestamp: receipt => web3.eth.getBlock(receipt.blockNumber).then(block => block.timestamp),
  },
  forward: {
    blocknumber: time.advanceBlockTo,
    timestamp: time.increaseTo,
  },
};
