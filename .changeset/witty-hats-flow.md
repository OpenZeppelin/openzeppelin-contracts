---
'openzeppelin-solidity': patch
---

`Bytes`: Fix `lastIndexOf(bytes,byte,uint256)` with empty buffers and finite position to correctly return `type(uint256).max` instead of accessing uninitialized memory sections.
