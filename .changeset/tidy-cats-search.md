---
'openzeppelin-solidity': patch
---

`ERC7579Utils`: `decodeBatch` now rejects executions that reference calldata located before the `executionCalldata` buffer, and performs its structural validation regardless of the buffer's position in `msg.data`. Malformed buffers that previously only reverted when an execution was dereferenced now revert at decoding time.
