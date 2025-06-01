const SUBBYTE_TYPES = [
  { bits: 2n, name: 'pairMap' },
  { bits: 4n, name: 'nibbleMap' },
];

const BYTEMAP_TYPES = [{ bits: 8n }, { bits: 16n }, { bits: 32n }, { bits: 64n }, { bits: 128n }];

module.exports = { BYTEMAP_TYPES, SUBBYTE_TYPES };
