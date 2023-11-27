const mapType = str => (str == 'uint256' ? 'Uint' : `${str.charAt(0).toUpperCase()}${str.slice(1)}`);

const formatType = type => ({
  name: `${mapType(type)}Set`,
  type,
});

const TYPES = ['bytes32', 'address', 'uint256'].map(formatType);

module.exports = { TYPES, formatType };
