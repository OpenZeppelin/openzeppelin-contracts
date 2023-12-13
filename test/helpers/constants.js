// TODO: deprecate the old version in favor of this one
const bigint = {
  MAX_UINT48: 2n ** 48n - 1n,
  MAX_UINT64: 2n ** 64n - 1n,
};

// TODO: remove toString() when bigint are supported
module.exports = {
  MAX_UINT48: bigint.MAX_UINT48.toString(),
  MAX_UINT64: bigint.MAX_UINT64.toString(),
  bigint,
};
