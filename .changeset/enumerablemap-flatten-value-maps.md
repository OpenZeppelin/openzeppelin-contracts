---
'openzeppelin-solidity': minor
---

`EnumerableMap`: Generate every map type from a single template instead of wrapping a shared `Bytes32ToBytes32Map`. Each map now holds its own typed `EnumerableSet` of keys and its own `_values` mapping rather than an `_inner` map, and `Bytes32ToBytes32Map` becomes an ordinary generated type. As a consequence, the generic `EnumerableMapNonexistentKey(bytes32)` error is replaced by one error per key type — `EnumerableMapNonexistentUint256Key`, `EnumerableMapNonexistentAddressKey`, `EnumerableMapNonexistentBytes32Key` and `EnumerableMapNonexistentBytes4Key`, alongside the existing `EnumerableMapNonexistentBytesKey` — so a failed `get` now reports the key in its own type instead of a `bytes32` cast. The pragma is lowered from `^0.8.24` to `^0.8.20`. Storage layout is preserved for every map except `Bytes4ToAddressMap`, whose keys are now stored in a packed `bytes4[]`.
