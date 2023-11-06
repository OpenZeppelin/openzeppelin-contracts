// TODO: remove toString() when bigint are supported
module.exports = {
  MAX_UINT48: (2n ** 48n - 1n).toString(),
  MAX_UINT64: (2n ** 64n - 1n).toString(),
};
