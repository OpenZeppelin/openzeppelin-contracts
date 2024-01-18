const { capitalize } = require('../../helpers');

const mapType = str => (str == 'uint256' ? 'Uint' : capitalize(str));

const formatType = (keyType, valueType) => ({
  name: `${mapType(keyType)}To${mapType(valueType)}Map`,
  keyType,
  valueType,
});

const TYPES = [
  ['uint256', 'uint256'],
  ['uint256', 'address'],
  ['address', 'uint256'],
  ['bytes32', 'uint256'],
].map(args => formatType(...args));

module.exports = {
  TYPES,
  formatType,
};
