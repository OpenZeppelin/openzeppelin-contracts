---
'openzeppelin-solidity': patch
---

`ERC7579Utils`: In `decodeBatch`, always traverse the array and enforce that each item and its `callData` sub-buffer lie within `[executionBatch.offset, bound]` with overflow-safe arithmetic, rejecting wrapping element offsets that would otherwise land at a lower absolute calldata offset than the batch.
