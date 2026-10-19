---
'openzeppelin-solidity': patch
---

`ERC7579Utils`: `decodeBatch` now requires, like `abi.decode`, that the offsets of the executions and of their calldata fit in 64 bits, and rejects executions that reference calldata located outside of the `executionCalldata` buffer. Its structural validation is performed regardless of the buffer's position in `msg.data`. Malformed buffers that previously only reverted when an execution was dereferenced now revert at decoding time.
