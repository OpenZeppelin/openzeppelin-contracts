---
'openzeppelin-solidity': minor
---

`ERC4337Utils`: Added variants of `packValidationData(address,uint48,uint48)` and `packValidationData(bool,uint48,uint48)` that receive a `ValidationRange` argument, could be timestamp or block number. Similarly, the `parseValidationData` now returns a `ValidationRange` too.
