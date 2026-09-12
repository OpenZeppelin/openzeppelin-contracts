---
'openzeppelin-solidity': patch
---

`AccessManager`: Use transient storage for the `_executionId` flag that guards in-progress executions, saving gas on every `execute` call. This raises the file's Solidity pragma from `^0.8.20` to `^0.8.28`, which is required for the `transient` storage location.
