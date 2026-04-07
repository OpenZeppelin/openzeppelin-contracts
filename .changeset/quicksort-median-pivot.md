---
'openzeppelin-solidity': patch
---

`Arrays`: Optimize `_quickSort` with median-of-three pivot selection to avoid worst-case O(n²) behavior on already-sorted inputs.
