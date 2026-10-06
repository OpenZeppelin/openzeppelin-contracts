---
'openzeppelin-solidity': patch
---

Reset memoized docgen getters after exceptions so later reads can retry and preserve the original error.
