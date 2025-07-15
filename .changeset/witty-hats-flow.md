---
'openzeppelin-solidity': patch
---

`Bytes`: Fix an issue when calling `lastIndexOf(bytes,byte,uint256)` with an empty buffer and a lookup position that is not 2²⁵⁶-1.
