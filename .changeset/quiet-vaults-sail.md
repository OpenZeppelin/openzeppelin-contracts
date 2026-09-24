---
'openzeppelin-solidity': minor
---

`IERC4626`, `ERC4626`: Make `deposit` and `mint` `payable` and add an internal `_checkPayment` hook that validates the native value (`msg.value`) sent with them. This enables vaults whose underlying is the chain's native asset (see `ERC7535`) without changing the function selectors or the ERC-165 interface id. The default `_checkPayment` reverts on any non-zero `msg.value`, so ERC-20 vaults keep rejecting native value exactly as before. NOTE: because Solidity does not allow a `payable` function to be overridden as `nonpayable`, contracts that override or implement `IERC4626.deposit`/`mint` as `nonpayable` must add `payable` to keep compiling.
