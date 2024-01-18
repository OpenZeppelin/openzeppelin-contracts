const { capitalize } = require('../../helpers');

const mapType = str => (str == 'uint256' ? 'Uint' : capitalize(str));

const formatType = type => ({
  name: `${mapType(type)}Set`,
  type,
});

const TYPES = ['bytes32', 'address', 'uint256'].map(formatType);

module.exports = { TYPES, formatType };
