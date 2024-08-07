---
'openzeppelin-solidity': minor
---

`ERC4626`: compute `maxWithdraw` using `maxRedeem` and `previewRedeem` so that changes to the preview functions affect the max functions.
