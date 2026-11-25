---
'openzeppelin-solidity': patch
---

`SafeERC20`: Treat a token call that returns between 1 and 31 bytes as a failure. Previously, such a return could be read as `true` when completed with leftover calldata in the return buffer.
