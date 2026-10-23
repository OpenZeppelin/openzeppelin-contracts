---
'openzeppelin-solidity': major
---

`PaymasterERC20`: Pass the selected `token` to the `_minTokensPerNative` hook so multi-token paymasters can set a per-token price floor. This changes the hook's signature from `_minTokensPerNative()` to `_minTokensPerNative(IERC20 token)`.
