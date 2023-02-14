const helpers = require('@nomicfoundation/hardhat-network-helpers');

module.exports = {
  clock: {
    blocknumber: () => helpers.latestBlock(),
    timestamp: () => helpers.time.latest(),
  },
  clockFromReceipt: {
    blocknumber: receipt => Promise.resolve(receipt.blockNumber),
    timestamp: receipt => web3.eth.getBlock(receipt.blockNumber).then(block => block.timestamp),
  },
  forward: {
    blocknumber: helpers.mineUpTo,
    timestamp: helpers.time.increaseTo,
  },
};
