const { ethers } = require('hardhat');
const { time, mine, mineUpTo } = require('@nomicfoundation/hardhat-network-helpers');
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
  advance: {
    blocknumber: mine,
    timestamp: (by, mine = true) => (
      mine
      ? time.increase(by)
      : time.latest().then(clock => time.setNextBlockTimestamp(clock + Number(by)))
    ),
  },
  advanceTo: {
    blocknumber: mineUpTo,
    timestamp: (to, mine = true) => (
      mine
      ? time.increaseTo(to)
      : time.setNextBlockTimestamp(to)
    ),
  },
  duration: mapValues(time.duration, fn => n => ethers.toBigInt(fn(ethers.toNumber(n)))),
};
