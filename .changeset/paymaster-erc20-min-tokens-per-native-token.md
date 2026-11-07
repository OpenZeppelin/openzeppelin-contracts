---
'openzeppelin-solidity': minor
---

[BREAKING] `PaymasterERC20`: Pass the selected `token` to the `_minTokensPerNative` hook so multi-token paymasters can set a per-token minimum. The hook signature changes from `_minTokensPerNative()` to `_minTokensPerNative(IERC20 token)`; overrides must adopt the new signature.
