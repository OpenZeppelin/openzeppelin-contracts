---
'openzeppelin-solidity': minor
---

`Memory`: Add a `ConstSlice` type, obtained from `asConstSlice(bytes)` or `asConst(Slice)`, that marks a memory region as read-only at the type level. All read-only slice operations (`length`, `load`, `isReserved`, `equal`, `slice`, `toBytes`) accept both `Slice` and `ConstSlice`. Also add `write(Slice|ConstSlice,bytes)` to copy a slice into a caller-provided buffer instead of allocating a new one.
