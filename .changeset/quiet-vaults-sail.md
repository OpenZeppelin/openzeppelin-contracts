---
'openzeppelin-solidity': minor
---

[BREAKING] `IERC4626`, `ERC4626`: Make `deposit` and `mint` `payable` and add an internal `_enablePayableDeposit` hook (returning `false` by default) that controls whether native value sent with them is accepted. Overrides of `deposit` and `mint` must now be declared `payable`.
