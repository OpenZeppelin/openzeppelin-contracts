const { capitalize, mapValues } = require('../../helpers');

const mapType = str => (str == 'uint256' ? 'Uint' : capitalize(str));

const formatSetType = type => ({ name: `${mapType(type)}Set`, type });

const SET_TYPES = ['bytes32', 'address', 'uint256'].map(formatSetType);

const formatMapType = (keyType, valueType) => ({
  name: `${mapType(keyType)}To${mapType(valueType)}Map`,
  keyType,
  valueType,
});

const MAP_TYPES = ['uint256', 'address', 'bytes32']
  .flatMap((key, _, array) => array.map(value => [key, value]))
  .slice(0, -1) // remove bytes32 → byte32 (last one) that is already defined
  .map(args => formatMapType(...args));

const extendedTypeDescr = ({ type, size = 0, memory = false }) => {
  memory |= size > 0;

  const name = [type == 'uint256' ? 'Uint' : capitalize(type), size].filter(Boolean).join('x');
  const base = size ? type : undefined;
  const typeFull = size ? `${type}[${size}]` : type;
  const typeLoc = memory ? `${typeFull} memory` : typeFull;
  return { name, type: typeFull, typeLoc, base, size, memory };
};

const toExtendedSetTypeDescr = value => ({ name: value.name + 'Set', value });

const toExtendedMapTypeDescr = ({ key, value }) => ({
  name: `${key.name}To${value.name}Map`,
  keySet: toExtendedSetTypeDescr(key),
  key,
  value,
});

const EXTENDED_SET_TYPES = [
  { type: 'bytes32', size: 2 },
  { type: 'string', memory: true },
  { type: 'bytes', memory: true },
]
  .map(extendedTypeDescr)
  .map(toExtendedSetTypeDescr);

const EXTENDED_MAP_TYPES = [
  { key: { type: 'bytes', memory: true }, value: { type: 'uint256' } },
  { key: { type: 'string', memory: true }, value: { type: 'string', memory: true } },
]
  .map(entry => mapValues(entry, extendedTypeDescr))
  .map(toExtendedMapTypeDescr);

module.exports = {
  SET_TYPES,
  MAP_TYPES,
  EXTENDED_SET_TYPES,
  EXTENDED_MAP_TYPES,
  formatSetType,
  formatMapType,
  extendedTypeDescr,
  toExtendedSetTypeDescr,
  toExtendedMapTypeDescr,
};
