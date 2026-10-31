---
'openzeppelin-solidity': patch
---

`hardhat-solidity-docgen`: The `resolveUserConfig` hook no longer mutates the shared `defaults` singleton or the caller's `userConfig.docgen` object when setting `root` and `sourcesDir`. A fresh resolved config object is created instead, preventing cross-contamination between config resolutions and errors on frozen objects. `defineGetterMemoized` now resets its state to `todo` when the getter throws, so subsequent property accesses retry the getter instead of throwing "Detected recursion".
