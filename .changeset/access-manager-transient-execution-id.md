---
'openzeppelin-solidity': minor
---

`AccessManager`: Keep the execution identifier used by {execute} in transient storage instead of persistent storage. As a consequence, the pragma is raised to `^0.8.24` and `AccessManager` now requires EIP-1153, which makes it undeployable on chains that do not support transient storage.
