const { capitalize, range } = require('../../helpers');

const TYPES = []
  .concat(
    'bool',
    'address',
    range(1, 33).map(i => `bytes${i}`),
    range(8, 264, 8).map(i => `uint${i}`),
    range(8, 264, 8).map(i => `int${i}`),
  )
  .map(type => ({
    udvt: `${capitalize(type)}Slot`,
    type,
  }));

module.exports = {
  TYPES,
};
