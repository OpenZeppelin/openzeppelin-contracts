---
"openzeppelin-solidity": patch
---

fix(Arrays): optimize _quickSort to prevent stack overflow

Replaces tail recursion with iterative approach, always recursing on the smaller partition.
Reduces max recursion depth from O(n) to O(log n), fixing stack overflow at ~169 elements.
