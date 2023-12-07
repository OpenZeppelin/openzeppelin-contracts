---
'openzeppelin-solidity': patch
---

`Multicall`: Make aware of non-canonical context (i.e. `msg.sender` is not `_msgSender()`), allowing compatibility with `ERC2771Context`.
