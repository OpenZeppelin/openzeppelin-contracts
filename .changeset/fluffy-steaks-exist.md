---
'openzeppelin-solidity': patch
---

`Create2`, `Clones`: Mask `computeAddress` and `cloneDeterministic` outputs to produce a clean value for an `address` type (i.e. only use 20 bytes)
