const { ethers } = require('hardhat');
const { time, mineUpTo } = require('@nomicfoundation/hardhat-network-helpers');
const { mapValues } = require('./iterate');

module.exports = {
  clock: {
    blocknumber: () => time.latestBlock(),
    timestamp: () => time.latest(),
  },
  clockFromReceipt: {
    blocknumber: receipt => Promise.resolve(receipt.blockNumber),
    timestamp: receipt => ethers.provider.getBlock(receipt.blockNumber).then(block => block.timestamp),
  },
  forward: {
    blocknumber: mineUpTo,
    timestamp: (to, mine = true) => (mine ? time.increaseTo(to) : time.setNextBlockTimestamp(to)),
  },
  duration: time.duration,
};

// TODO: deprecate the old version in favor of this one
module.exports.bigint = {
  clock: mapValues(module.exports.clock, fn => () => fn().then(ethers.toBigInt)),
  clockFromReceipt: mapValues(module.exports.clockFromReceipt, fn => receipt => fn(receipt).then(ethers.toBigInt)),
  forward: module.exports.forward,
  duration: mapValues(module.exports.duration, fn => n => ethers.toBigInt(fn(ethers.toNumber(n)))),
};
