const BYTES_PACK_SIZES = {
  32: {
    uint128: 2,
    uint64: 4,
  },
  16: {
    uint64: 2,
    uint32: 4,
  },
  8: {
    uint32: 2,
    uint16: 4,
  },
  4: {
    uint16: 2,
    uint8: 4,
  },
};

module.exports = { BYTES_PACK_SIZES };
