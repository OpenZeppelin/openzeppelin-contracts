---
'openzeppelin-solidity': minor
---

[Deprecations]
`Checkpoints`, `DoubleEndedQueue`, `EnumerableMap` and `EnumerableSet`: Deprecate the `at` function for accessing a specific index of the structure. We introduce new `pos` functions to replace them.
