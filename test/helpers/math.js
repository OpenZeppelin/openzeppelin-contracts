module.exports = {
  // sum of integer / bigint
  sum: (...args) => args.reduce((acc, n) => acc + n, 0), // TODO: remove in favor of the bigint version
  bigintSum: (...args) => args.reduce((acc, n) => acc + n, 0n),
  // min of integer / bigint
  min: (...args) => args.slice(1).reduce((x, y) => (x < y ? x : y), args[0]),
  // max of integer / bigint
  max: (...args) => args.slice(1).reduce((x, y) => (x > y ? x : y), args[0]),
};
