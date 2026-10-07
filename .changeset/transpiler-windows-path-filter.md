---
'openzeppelin-solidity': patch
---

`hardhat-transpiler`: normalize the source directory path to POSIX before filtering build-info sources, so transpilation works on Windows when the Solidity sources live in a nested directory.
