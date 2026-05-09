---
'openzeppelin-solidity': patch
---

Optimize `_quickSort` to use iterative approach, preventing stack overflow for arrays larger than ~169 elements
