---
'openzeppelin-solidity': major
---

[BREAKING] Interfaces: All interface definitions are now consolidated under `contracts/interfaces/`. The duplicated module-local interface files (e.g. `token/ERC20/IERC20.sol`, `utils/introspection/IERC165.sol`, `access/IAccessControl.sol`, `governance/IGovernor.sol`, `proxy/beacon/IBeacon.sol`, and their variants) have been removed, along with the inline `ITransparentUpgradeableProxy` and `IEntryPointExtra` declarations. Import these interfaces from `@openzeppelin/contracts/interfaces/<IName>.sol` instead of their former module paths.
