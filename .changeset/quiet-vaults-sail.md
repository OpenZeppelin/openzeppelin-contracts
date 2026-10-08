---
'openzeppelin-solidity': minor
---

`IERC4626`, `ERC4626`: Make `deposit` and `mint` `payable` and add an internal `_checkPayment` hook that validates the native value (`msg.value`) sent with them.
