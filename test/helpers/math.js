module.exports = {
  // sum of integer / bignumber
  sum: (...args) => args.reduce((acc, n) => acc + n, 0),
  BNsum: (...args) => args.reduce((acc, n) => acc.add(n), web3.utils.toBN(0)),
  // min of integer / bignumber
  min: (...args) => args.slice(1).reduce((x, y) => (x < y ? x : y), args[0]),
  BNmin: (...args) => args.slice(1).reduce((x, y) => (x.lt(y) ? x : y), args[0]),
  // max of integer / bignumber
  max: (...args) => args.slice(1).reduce((x, y) => (x > y ? x : y), args[0]),
  BNmax: (...args) => args.slice(1).reduce((x, y) => (x.gt(y) ? x : y), args[0]),
};
