---
'openzeppelin-solidity': major
---

[BREAKING] `IERC20Permit` and `IERC2612`: Merge `IERC20Permit` interface into `IERC2612`. Usages must be updated from `IERC20Permit` to `IERC2612`, and imports from `token/ERC20/extensions/IERC20Permit.sol` or `interfaces/IERC20Permit.sol` to `interfaces/IERC2612.sol`.
