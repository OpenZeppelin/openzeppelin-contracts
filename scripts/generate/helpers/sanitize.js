export const address = expr => `and(${expr}, shr(96, not(0)))`;
export const bool = expr => `iszero(iszero(${expr}))`;
export const bytes = (expr, size) => `and(${expr}, shl(${256 - 8 * size}, not(0)))`;
