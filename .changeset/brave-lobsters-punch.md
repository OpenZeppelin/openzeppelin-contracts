---
'openzeppelin-solidity': major
---

`Governor`: Refactored internals to implement common queuing logic in the core module of the Governor. Added `queue` and `_queueOperations` functions that act at different levels. Modules that implement queuing via timelocks are expected to override `_queueOperations` to implement the timelock-specific logic. Added `_executeOperations` as the equivalent for execution.
