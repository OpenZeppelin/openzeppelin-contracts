---
'openzeppelin-solidity': patch
---

`Arrays`: Optimize `_quickSort()` to prevent stack overflow by using hybrid recursive-iterative approach, reducing maximum recursion depth from O(n) to O(log n) and allowing arrays larger than 169 items to be sorted.
