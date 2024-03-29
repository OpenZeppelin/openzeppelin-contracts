---
'openzeppelin-solidity': minor
---

Replaces simple ternary operations `cond ? a : b` by a more efficient branchless `select` function, now supported by `Math.sol` and `SignedMath.sol`.
