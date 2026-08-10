const { ethers } = require('hardhat');
const { time, mine, mineUpTo } = require('@nomicfoundation/hardhat-network-helpers');
const { mapValues } = require('./iterate');

const clock = {
  blockNumber: () => time.latestBlock().then(ethers.toBigInt),
  timestamp: () => time.latest().then(ethers.toBigInt),
};
const clockFromReceipt = {
  blockNumber: receipt => Promise.resolve(receipt).then(({ blockNumber }) => ethers.toBigInt(blockNumber)),
  timestamp: receipt =>
    Promise.resolve(receipt)
      .then(({ blockNumber }) => ethers.provider.getBlock(blockNumber))
      .then(({ timestamp }) => ethers.toBigInt(timestamp)),
};
const increaseBy = {
  blockNumber: mine,
  timestamp: (delay, mine = true) =>
    time.latest().then(clock => increaseTo.timestamp(clock + ethers.toNumber(delay), mine)),
};
const increaseTo = {
  blockNumber: mineUpTo,
  timestamp: (to, mine = true) => (mine ? time.increaseTo(to) : time.setNextBlockTimestamp(to)),
};
const duration = mapValues(time.duration, fn => n => ethers.toBigInt(fn(ethers.toNumber(n))));

module.exports = {
  clock,
  clockFromReceipt,
  increaseBy,
  increaseTo,
  duration,
};
