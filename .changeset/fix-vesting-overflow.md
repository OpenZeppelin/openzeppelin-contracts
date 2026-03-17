---
'openzeppelin-solidity': patch
---

`VestingWallet`: Prevent overflow in `vestedAmount` when `balance + released()` exceeds `uint256` max.
