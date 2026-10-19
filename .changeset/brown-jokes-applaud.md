---
'openzeppelin-solidity': patch
---

`ERC7579Utils`: Check in `decodeBatch` that every execution, including its `callData`, lies within `executionCalldata`.
