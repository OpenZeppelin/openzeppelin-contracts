---
'openzeppelin-solidity': minor
---

`EnumerableSet`: Generate every set type from a single template instead of wrapping a shared `bytes32`-based `Set`. `Bytes32Set`, `AddressSet` and `UintSet` now hold their own `_values` array and `_positions` mapping rather than an `_inner` `Set`, and the internal `Set` type is removed. The storage layout is unchanged, so existing deployments remain compatible. Dropping the resulting `Arrays` dependency also lowers the pragma from `^0.8.24` to `^0.8.20`.
