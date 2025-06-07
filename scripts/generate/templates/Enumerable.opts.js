const { capitalize, mapValues } = require('../../helpers');

const typeDescr = ({ type, size = 0, memory = false }) => {
  memory |= size > 0;

  const name = [type == 'uint256' ? 'Uint' : capitalize(type), size].filter(Boolean).join('x');
  const base = size ? type : undefined;
  const typeFull = size ? `${type}[${size}]` : type;
  const typeLoc = memory ? `${typeFull} memory` : typeFull;
  return { name, type: typeFull, typeLoc, base, size, memory };
};

const toSetTypeDescr = value => ({
  name: value.name + 'Set',
  value,
});

const toMapTypeDescr = ({ key, value }) => ({
  name: `${key.name}To${value.name}Map`,
  keySet: toSetTypeDescr(key),
  key,
  value,
});

const SET_TYPES = [
  { type: 'bytes32' },
  { type: 'address' },
  { type: 'uint256' },
  { type: 'string', memory: true },
  { type: 'bytes', memory: true },
]
  .map(typeDescr)
  .map(toSetTypeDescr);

const MAP_TYPES = []
  .concat(
    // value type maps
    ['uint256', 'address', 'bytes32']
      .flatMap((keyType, _, array) => array.map(valueType => ({ key: { type: keyType }, value: { type: valueType } })))
      .slice(0, -1), // remove bytes32 → bytes32 (last one) that is already defined
    // non-value type maps
    { key: { type: 'bytes', memory: true }, value: { type: 'bytes', memory: true } },
  )
  .map(entry => mapValues(entry, typeDescr))
  .map(toMapTypeDescr);

module.exports = {
  SET_TYPES,
  MAP_TYPES,
  typeDescr,
  toSetTypeDescr,
  toMapTypeDescr,
};
