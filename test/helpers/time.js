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
  duration: {
    seconds: function (val) {
      return BigInt(val);
    },
    minutes: function (val) {
      return BigInt(val) * this.seconds(60);
    },
    hours: function (val) {
      return BigInt(val) * this.minutes(60);
    },
    days: function (val) {
      return BigInt(val) * this.hours(24);
    },
    weeks: function (val) {
      return BigInt(val) * this.days(7);
    },
    years: function (val) {
      return BigInt(val) * this.days(365);
    },
  },
};
