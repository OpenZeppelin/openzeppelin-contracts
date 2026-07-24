---
'openzeppelin-solidity': minor
---

`DoubleEndedQueue`: Add `values(deque, start, end)` to return a slice of the queue as an array, mirroring the paginated `values` accessor in `EnumerableSet`. Out-of-bound values for `start` and `end` are clamped to the queue length.
