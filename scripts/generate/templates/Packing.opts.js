const { product, range } = require('../../helpers');

const LENGTHS = range(1, 33).reverse();
const TYPES = product(LENGTHS, LENGTHS)
  .filter(([i, j]) => i > j && i % j == 0)
  .map(([i, j]) => ({
    i,
    j,
    type: `Uint${8 * j}x${i / j}`,
    block: { u: `uint${8 * i}`, b: `bytes${i}` },
    field: { u: `uint${8 * j}`, b: `bytes${j}` },
    count: i / j,
    shift: 8 * j,
  }));

module.exports = {
  TYPES,
};
