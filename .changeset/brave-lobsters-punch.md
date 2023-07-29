---
'openzeppelin-solidity': major
---

`Governor`: Refactored internals to implement common queuing logic in the core module of the Governor. Added `queue`, `_queue`, and `_doQueue` functions that act at different levels. Modules that implement queuing via timelocks are expected to override `_doQueue` to implement the timelock-specific logic.
