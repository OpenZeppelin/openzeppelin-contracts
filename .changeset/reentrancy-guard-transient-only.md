---
'openzeppelin-solidity': major
---

[BREAKING] `ReentrancyGuard`: The guard is now stored in transient storage (EIP-1153) instead of regular storage, completing the deprecation announced in v5.x. Inheriting contracts now require Solidity `^0.8.24` and a chain where EIP-1153 is available. `ReentrancyGuardTransient` has been removed; use `ReentrancyGuard` instead.
