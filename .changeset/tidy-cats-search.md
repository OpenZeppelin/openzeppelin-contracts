---
'openzeppelin-solidity': patch
---

`ERC7579Utils`: `decodeBatch` now checks that every execution and its calldata lie within the `executionCalldata` buffer, with offsets that fit in 64 bits like `abi.decode`. Malformed buffers that previously only reverted when an execution was dereferenced now revert at decoding time.
