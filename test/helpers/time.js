const { ethers } = require('hardhat');
const { time, mineUpTo } = require('@nomicfoundation/hardhat-network-helpers');
const { mapValues } = require('./iterate');

module.exports = {
  clock: {
    blocknumber: () => time.latestBlock().then(ethers.toBigInt),
    timestamp: () => time.latest().then(ethers.toBigInt),
  },
  clockFromReceipt: {
    blocknumber: receipt => Promise.resolve(ethers.toBigInt(receipt.blockNumber)),
    timestamp: receipt => ethers.provider.getBlock(receipt.blockNumber).then(block => ethers.toBigInt(block.timestamp)),
  },
  forward: {
    blocknumber: mineUpTo,
    timestamp: (to, mine = true) => (mine ? time.increaseTo(to) : time.setNextBlockTimestamp(to)),
  },
  duration: mapValues(time.duration, fn => n => ethers.toBigInt(fn(ethers.toNumber(n)))),
};
