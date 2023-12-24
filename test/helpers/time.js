const { ethers } = require('hardhat');
const { time, mine, mineUpTo } = require('@nomicfoundation/hardhat-network-helpers');
const { mapValues } = require('./iterate');

const clock = {
  blocknumber: () => time.latestBlock(),
  timestamp: () => time.latest(),
};
const clockFromReceipt = {
  blocknumber: receipt => Promise.resolve(receipt.blockNumber),
  timestamp: receipt => ethers.provider.getBlock(receipt.blockNumber).then(block => block.timestamp),
};
const increaseBy = {
  blockNumber: mine,
  timestamp: (delay, mine = true) =>
    time.latest().then(clock => increaseTo.timestamp(clock + ethers.toNumber(delay), mine)),
};
const increaseTo = {
  blocknumber: mineUpTo,
  timestamp: (to, mine = true) => (mine ? time.increaseTo(to) : time.setNextBlockTimestamp(to)),
};
const duration = time.duration;

module.exports = {
  clock,
  clockFromReceipt,
  increaseBy,
  increaseTo,
  duration,
};

// TODO: deprecate the old version in favor of this one
module.exports.bigint = {
  clock: mapValues(clock, fn => () => fn().then(ethers.toBigInt)),
  clockFromReceipt: mapValues(clockFromReceipt, fn => receipt => fn(receipt).then(ethers.toBigInt)),
  increaseBy: increaseBy,
  increaseTo: increaseTo,
  duration: mapValues(duration, fn => n => ethers.toBigInt(fn(ethers.toNumber(n)))),
};
