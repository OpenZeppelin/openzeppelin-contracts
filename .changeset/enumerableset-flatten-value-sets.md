---
'openzeppelin-solidity': minor
---

`EnumerableSet`: Generate every set type from a single template instead of wrapping a shared `bytes32`-based `Set`. `Bytes32Set`, `Bytes4Set`, `AddressSet` and `UintSet` now hold their own `_values` array and `_positions` mapping rather than an `_inner` `Set`, and the internal `Set` type is removed. Dropping the resulting `Arrays` dependency also lowers the pragma from `^0.8.24` to `^0.8.20`. `Bytes32Set`, `AddressSet` and `UintSet` keep their previous storage layout, but `Bytes4Set` does not: its values are now stored in a `bytes4[]`, which packs 8 entries per slot instead of one. Contracts holding a `Bytes4Set` in storage cannot be upgraded to this version without migrating the set.
