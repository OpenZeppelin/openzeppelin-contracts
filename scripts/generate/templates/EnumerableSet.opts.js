const { capitalize } = require('../../helpers');

const mapType = ({ type, size }) => [type == 'uint256' ? 'Uint' : capitalize(type), size].filter(Boolean).join('x');

const formatType = ({ type, size = undefined }) => ({
  name: `${mapType({ type, size })}Set`,
  type: size != undefined ? `${type}[${size}]` : type,
  base: size != undefined ? type : undefined,
  size,
});

const TYPES = [{ type: 'bytes32' }, { type: 'bytes32', size: 2 }, { type: 'address' }, { type: 'uint256' }].map(
  formatType,
);

module.exports = { TYPES, formatType };
