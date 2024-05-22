const { product, range } = require('../../helpers');

const LENGTHS = range(1, 33).reverse();
const TYPES = product(LENGTHS, LENGTHS)
  .filter(([i, j]) => i > j && i % j == 0)
  .map(([i, j]) => ({
    i,
    j,
    inner: `uint${8 * j}`,
    outer: `Uint${8 * j}x${i / j}`,
    pack: `bytes${i}`,
    count: i / j,
    shift: 8 * j,
  }));

module.exports = {
  TYPES,
};
