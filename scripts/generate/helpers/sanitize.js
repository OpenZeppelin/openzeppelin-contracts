module.exports = {
  address: expr => `and(${expr}, shr(96, not(0)))`,
  bool: expr => `iszero(iszero(${expr}))`,
  bytes: (expr, size) => `and(${expr}, shl(${256 - 8 * size}, not(0)))`,
};
