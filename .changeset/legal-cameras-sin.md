---
'openzeppelin-solidity': minor
---

`AccessManager`: treat `setAuthority` differently in `canCall` to prevent bypassing the `updateAuthority` security using an `execute`.
