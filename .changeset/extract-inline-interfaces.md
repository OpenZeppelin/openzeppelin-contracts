---
'openzeppelin-solidity': minor
---

`ITransparentUpgradeableProxy`, `IEntryPointExtra`: Move these interfaces to dedicated files (`proxy/transparent/ITransparentUpgradeableProxy.sol` and `account/utils/IEntryPointExtra.sol`), previously declared inline in `TransparentUpgradeableProxy` and `ERC4337Utils`.
