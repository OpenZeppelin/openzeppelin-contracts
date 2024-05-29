const { range } = require('../../helpers');

const TYPES = range(1, 33)
  .map(size => ({
    size,
    type: `PackedBytes${size}`,
    bytes: `bytes${size}`,
    uint: `uint${8 * size}`,
  }))
  .filter(type => type.size == 1 || type.size == 2 || type.size % 4 == 0);

module.exports = {
  TYPES,
  findType: size => TYPES.find(t => t.size == size),
};
