const { product } = require('../../helpers');

const OPTS = product(
  [
    { suffix: '', location: 'memory' },
    { suffix: 'Calldata', location: 'calldata' },
  ],
  [{ visibility: 'pure' }, { visibility: 'view', hash: 'hasher' }],
).map(objs => Object.assign({}, ...objs));

module.exports = { OPTS };
