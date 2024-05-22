const { product, range } = require('../../helpers');

const LENGTHS = range(1, 33).reverse();
const TYPES = product(LENGTHS, LENGTHS)
  .filter(([i, j]) => i > j && i % j == 0)
  .map(([i, j]) => ({
    i,
    j,
    type: `Uint${8 * j}x${i / j}`,
    field: `uint${8 * j}`,
    integ: `uint${8 * i}`,
    bytes: `bytes${i}`,
    count: i / j,
    shift: 8 * j,
  }));

module.exports = {
  TYPES,
};
