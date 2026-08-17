---
'openzeppelin-solidity': minor
---

[BREAKING] `Memory`: `slice(Slice,uint256,uint256)` now takes `(start, end)` bounds instead of `(offset, length)`, and both `slice` overloads truncate out-of-range bounds instead of reverting with `Panic.ARRAY_OUT_OF_BOUNDS`. This aligns `Memory.slice` with `Bytes.slice` and `Arrays.slice`. The signature is unchanged, so existing calls keep compiling with a different meaning: `s.slice(a, b)` must be rewritten as `s.slice(a, a + b)`.
