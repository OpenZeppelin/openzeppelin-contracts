import { capitalize, range, product } from '../helpers.js';

// ─── Shared helpers ───
export * as sanitize from './helpers/sanitize.js';
export * from './helpers/conversion.js';
export * from '../helpers.js';

export const args = (...parts) => parts.filter(Boolean).join(', ');

// ─── All solidity types ───
export const ALL_TYPES = Object.fromEntries(
  [
    { type: 'address', size: 160 },
    { type: 'bool', name: 'boolean', size: 1 },
    ...range(1, 33).map(size => ({
      type: `bytes${size}`,
      size: 8 * size,
      upcastTo: size < 32 ? 'bytes32' : undefined,
    })),
    ...range(8, 257, 8).map(size => ({
      type: `uint${size}`,
      size,
      upcastTo: size < 256 ? 'uint256' : undefined,
    })),
    ...range(8, 257, 8).map(size => ({
      type: `int${size}`,
      size,
      upcastTo: size < 256 ? 'int256' : undefined,
      signed: true,
    })),
    { type: 'string' },
    { type: 'bytes' },
  ]
    .map(entry => ({
      ...entry,
      name: entry.name ?? entry.type,
      capitalized: capitalize(entry.name ?? entry.type),
      location: entry.size ? '' : 'memory',
    }))
    .map((entry, _, all) => ({
      ...entry,
      upcastOf: all.filter(type => type.upcastTo === entry.type),
    }))
    .map(entry => [entry.type, entry]),
);

// ─── Arrays ───
export const ARRAYS_TYPES = [
  ALL_TYPES.address,
  ALL_TYPES.bytes32,
  ALL_TYPES.uint256,
  ALL_TYPES.bytes,
  ALL_TYPES.string,
];

export const ARRAYS_VALUE_TYPES = ARRAYS_TYPES.filter(type => type.size);
export const ARRAYS_CAST_TYPES = ARRAYS_VALUE_TYPES.filter(type => type.name !== 'uint256');
export const ARRAYS_SORT_TYPES = ARRAYS_VALUE_TYPES.toSorted((a, b) => (b.name == 'uint256') - (a.name == 'uint256'));
export const ARRAYS_COMPARATOR_TYPES = ARRAYS_VALUE_TYPES.filter(type => type.size < 256);

// ─── Checkpoints (Checkpoints + Checkpoints.t) ───
export const CHECKPOINTS_LENGTH = [256, 224, 208, 160].map(size => ({ size, keySize: size < 256 ? 256 - size : 256 }));

// ─── Enumerable (EnumerableSet, EnumerableMap) ───
export const SET_TYPES = [
  ALL_TYPES.bytes32,
  ALL_TYPES.bytes4,
  ALL_TYPES.address,
  ALL_TYPES.uint256,
  ALL_TYPES.string,
  ALL_TYPES.bytes,
].map(value => ({
  name: `${value.name == 'uint256' ? 'Uint' : value.capitalized}Set`,
  value,
}));

export const MAP_TYPES = []
  .concat(
    // value type maps
    [ALL_TYPES.uint256, ALL_TYPES.address, ALL_TYPES.bytes32]
      .flatMap((key, _, array) => array.map(value => ({ key, value })))
      .slice(0, -1), // remove bytes32 → bytes32 (last one) that is already defined
    // other value type maps
    { key: ALL_TYPES.bytes4, value: ALL_TYPES.address },
    // non-value type maps
    { key: ALL_TYPES.bytes, value: ALL_TYPES.bytes },
  )
  .map(({ key, value }) => ({
    name: `${key.name === 'uint256' ? 'Uint' : key.capitalized}To${value.name === 'uint256' ? 'Uint' : value.capitalized}Map`,
    key,
    value,
  }));

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
export const SLOT_TYPES = Object.values(ALL_TYPES).filter(type => !type.upcastTo);
