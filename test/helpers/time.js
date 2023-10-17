const { time, mineUpTo } = require('@nomicfoundation/hardhat-network-helpers');

module.exports = {
  clock: {
    blocknumber: () => time.latestBlock(),
    timestamp: () => time.latest(),
  },
  clockFromReceipt: {
    blocknumber: receipt => Promise.resolve(receipt.blockNumber),
    timestamp: receipt => web3.eth.getBlock(receipt.blockNumber).then(block => block.timestamp),
    // TODO: update for ethers receipt
    // timestamp: receipt => receipt.getBlock().then(block => block.timestamp),
  },
  forward: {
    blocknumber: mineUpTo,
    timestamp: time.increaseTo,
  },
};
