const { capitalize } = require('../../helpers');

const TYPES = [
  { type: 'address', isValueType: true },
  { type: 'bool', isValueType: true, name: 'Boolean' },
  { type: 'bytes32', isValueType: true, variants: ['bytes4'] },
  { type: 'uint256', isValueType: true, variants: ['uint32'] },
  { type: 'int256', isValueType: true, variants: ['int32'] },
  { type: 'string', isValueType: false },
  { type: 'bytes', isValueType: false },
].map(type => Object.assign(type, { name: type.name ?? capitalize(type.type) }));

Object.assign(TYPES, Object.fromEntries(TYPES.map(entry => [entry.type, entry])));

module.exports = { TYPES };
