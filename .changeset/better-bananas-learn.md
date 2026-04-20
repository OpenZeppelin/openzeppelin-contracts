---
'openzeppelin-solidity': minor
---

`ERC20Vault`: Introduced base vault contract that abstracts core vault mechanics (asset/share conversions, max functions) without enforcing specific deposit/withdraw flows. `ERC4626` now extends `ERC20Vault`.
