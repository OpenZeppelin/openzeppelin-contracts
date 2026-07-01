import { ethers } from 'ethers';

export const clock = ({ networkHelpers }) => ({
  blockNumber: () => networkHelpers.time.latestBlock().then(ethers.toBigInt),
  timestamp: () => networkHelpers.time.latest().then(ethers.toBigInt),
});

export const clockFromReceipt = ({ ethers }) => ({
  blockNumber: receipt => Promise.resolve(receipt).then(({ blockNumber }) => ethers.toBigInt(blockNumber)),
  timestamp: receipt =>
    Promise.resolve(receipt)
      .then(({ blockNumber }) => ethers.provider.getBlock(blockNumber))
      .then(({ timestamp }) => ethers.toBigInt(timestamp)),
});

export const increaseBy = ({ networkHelpers }) => ({
  blockNumber: networkHelpers.mine,
  timestamp: (delay, mine = true) =>
    networkHelpers.time
      .latest()
      .then(clock => clock + ethers.toNumber(delay))
      .then(to => (mine ? networkHelpers.time.increaseTo(to) : networkHelpers.time.setNextBlockTimestamp(to))),
});

export const increaseTo = ({ networkHelpers }) => ({
  blockNumber: networkHelpers.mineUpTo,
  timestamp: (to, mine = true) =>
    mine ? networkHelpers.time.increaseTo(to) : networkHelpers.time.setNextBlockTimestamp(to),
});

export const duration = ({ networkHelpers }) => ({
  years: n => ethers.toBigInt(networkHelpers.time.duration.years(ethers.toNumber(n))),
  weeks: n => ethers.toBigInt(networkHelpers.time.duration.weeks(ethers.toNumber(n))),
  days: n => ethers.toBigInt(networkHelpers.time.duration.days(ethers.toNumber(n))),
  hours: n => ethers.toBigInt(networkHelpers.time.duration.hours(ethers.toNumber(n))),
  minutes: n => ethers.toBigInt(networkHelpers.time.duration.minutes(ethers.toNumber(n))),
  seconds: n => ethers.toBigInt(networkHelpers.time.duration.seconds(ethers.toNumber(n))),
  millis: n => ethers.toBigInt(networkHelpers.time.duration.millis(ethers.toNumber(n))),
});
