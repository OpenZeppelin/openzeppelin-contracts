---
'openzeppelin-solidity': minor
---

`RLP`: Encode `bytes32` as a fixed size item and not as a scalar in `encode(bytes32)`. Scalar RLP encoding remains available by casting to a `uint256` and using the `encode(uint256)` function.
