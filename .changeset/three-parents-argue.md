---
'openzeppelin-solidity': patch
---

Add `_reentrancyGuardStorageSlot()` to `ReentrancyGuardTransient` as a `pure virtual` function to allow slot overrides for diamond-compatible modular usage. Related to #5681.
