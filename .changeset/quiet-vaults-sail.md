---
'openzeppelin-solidity': minor
---

[BREAKING] `IERC4626`, `ERC4626`: Make `deposit` and `mint` `payable` and add an internal `_checkNativeValue` hook that rejects any native value sent with them. Overrides of `deposit` and `mint` must now be declared `payable`.
