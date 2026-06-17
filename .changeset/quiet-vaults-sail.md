---
'openzeppelin-solidity': minor
---

`IERC4626`, `ERC4626`: Make `deposit` and `mint` `payable` and add an internal `_checkPayment` hook that validates the native value (`msg.value`) sent with them. This enables vaults whose underlying is the chain's native asset (see `ERC7535`) without changing the function selectors or the ERC-165 interface id. The default `_checkPayment` reverts on any non-zero `msg.value`, so ERC-20 vaults keep rejecting native value exactly as before.
