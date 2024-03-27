const { product } = require('../../helpers');

const OPTS = product(
  [
    { suffix: '', location: 'memory' },
    { suffix: 'Calldata', location: 'calldata' },
  ],
  [
    { visibility: 'pure' },
    { visibility: 'view', hashName: 'hasher', hashType: 'function(bytes32, bytes32) view returns (bytes32)' },
  ],
).map(objs => Object.assign({}, ...objs));

module.exports = { OPTS };
