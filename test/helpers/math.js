const { min, max, sum } = require('./iterate');

module.exports = {
  // re-export min, max & sum of integer / bignumber
  min,
  max,
  sum,
  // deprecated: BN version of sum
  BNsum: (...args) => args.reduce((acc, n) => acc.add(n), web3.utils.toBN(0)),
};
