const { time } = require('@openzeppelin/test-helpers');

module.exports = {
  clock: {
    blockNumber: () => web3.eth.getBlock('latest').then(block => block.number),
    timestamp: () => web3.eth.getBlock('latest').then(block => block.timestamp),
  },
  clockFromReceipt: {
    blockNumber: receipt => Promise.resolve(receipt.blockNumber),
    timestamp: receipt => web3.eth.getBlock(receipt.blockNumber).then(block => block.timestamp),
  },
  forward: {
    blockNumber: time.advanceBlockTo,
    timestamp: time.increaseTo,
  },
};
