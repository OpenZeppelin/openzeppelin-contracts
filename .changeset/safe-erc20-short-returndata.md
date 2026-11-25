---
'openzeppelin-solidity': patch
---

`SafeERC20`: Treat non-empty token return data too short to decode as a `bool` as a failure.
