const { capitalize } = require('../../helpers');

const TYPES = [
  { type: 'address', isValueType: true },
  { type: 'bool', isValueType: true, name: 'Boolean' },
  { type: 'bytes32', isValueType: true },
  { type: 'uint256', isValueType: true },
  { type: 'int256', isValueType: true },
  { type: 'string', isValueType: false },
  { type: 'bytes', isValueType: false },
].map(type => Object.assign(type, { name: type.name ?? capitalize(type.type) }));

module.exports = { TYPES };
