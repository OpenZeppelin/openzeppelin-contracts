---
'openzeppelin-solidity': major
---

`EnumerableSet` and `EnumerableMap`: Refactor all types to a flat structure that stores values in their actual type instead of casting to and from `bytes32`. This changes the storage layout of some instances.
