import { capitalize, mapValues, product } from '../helpers.js';

// ─── Shared helpers ───
export const isReferenceType = type => ['string', 'bytes'].includes(type);
export * as sanitize from './helpers/sanitize.js';
export * from './helpers/conversion.js';
export * from '../helpers.js';

export const args = (...parts) => parts.filter(Boolean).join(', ');

// ─── Arrays ───
export const ARRAYS_TYPES = [
  { type: 'address', size: 20 },
  { type: 'bytes32', size: 32 },
  { type: 'uint256', size: 32 },
  { type: 'bytes' }, // reference types have no size
  { type: 'string' },
].map(type => ({ ...type, isValueType: !isReferenceType(type.type) }));

export const ARRAYS_VALUE_TYPES = ARRAYS_TYPES.filter(type => type.isValueType);
export const ARRAYS_CAST_TYPES = ARRAYS_VALUE_TYPES.filter(type => type.type !== 'uint256');
export const ARRAYS_SORT_TYPES = ARRAYS_VALUE_TYPES.toSorted((a, b) => (b.type == 'uint256') - (a.type == 'uint256'));
export const ARRAYS_COMPARATOR_TYPES = ARRAYS_VALUE_TYPES.filter(type => type.size < 32);

// ─── Checkpoints (Checkpoints + Checkpoints.t) ───
export const CHECKPOINTS_LENGTH = [256, 224, 208, 160].map(size => ({ size, keySize: size < 256 ? 256 - size : 256 }));

// ─── Enumerable (EnumerableSet, EnumerableMap) ───
export const typeDescr = ({ type, size = 0, memory }) => {
  memory = (memory ?? isReferenceType(type)) || size > 0;

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

export const toMapTypeDescr = ({ key, value }) => ({
  name: `${key.name}To${value.name}Map`,
  keySet: toSetTypeDescr(key),
  key,
  value,
});

export const SET_TYPES = ['bytes32', 'bytes4', 'address', 'uint256', 'string', 'bytes']
  .map(type => typeDescr({ type }))
  .map(toSetTypeDescr);

export const MAP_TYPES = []
  .concat(
    // value type maps
    ['uint256', 'address', 'bytes32']
      .flatMap((keyType, _, array) => array.map(valueType => ({ key: { type: keyType }, value: { type: valueType } })))
      .slice(0, -1), // remove bytes32 → bytes32 (last one) that is already defined
    // other value type maps
    { key: { type: 'bytes4' }, value: { type: 'address' } },
    // non-value type maps
    { key: { type: 'bytes' }, value: { type: 'bytes' } },
  )
  .map(entry => mapValues(entry, typeDescr))
  .map(toMapTypeDescr);

// ─── MerkleProof ───
export const MERKLEPROOF_DEFAULT_HASH = 'Hashes.commutativeKeccak256';
export const MERKLEPROOF_OPTS = product(
  [
    { suffix: '', location: 'memory' },
    { suffix: 'Calldata', location: 'calldata' },
  ],
  [{ visibility: 'pure' }, { visibility: 'view', hash: 'hasher' }],
).map(objs => Object.assign({}, ...objs));

// ─── Packing (Packing + Packing.t) ───
export const PACKING_SIZES = [1, 2, 4, 6, 8, 10, 12, 16, 20, 22, 24, 28, 32];

// ─── SafeCast ───
// downcast target bit-lengths: 248, 240, ..., 8
export const SAFECAST_LENGTHS = Array.from({ length: 31 }, (_, i) => 248 - i * 8);

// ─── Slot family (StorageSlot, TransientSlot, SlotDerivation, and their mocks/tests) ───
export const SLOT_TYPES = [
  { type: 'address' },
  { type: 'bool', name: 'Boolean' },
  { type: 'bytes32', variants: ['bytes4'] },
  { type: 'uint256', variants: ['uint32'] },
  { type: 'int256', variants: ['int32'] },
  { type: 'string' },
  { type: 'bytes' },
].map(type => ({ ...type, name: type.name ?? capitalize(type.type), isValueType: !isReferenceType(type.type) }));
// allow keyed access (e.g. SLOT_TYPES.bool, SLOT_TYPES.address)
Object.assign(SLOT_TYPES, Object.fromEntries(SLOT_TYPES.map(entry => [entry.type, entry])));
export const SLOT_VALUE_TYPES = SLOT_TYPES.filter(type => type.isValueType);
