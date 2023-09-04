---
'openzeppelin-solidity': major
---

`ERC721`: Renamed `_requireMinted` to `_requireOwned` and added a return value with the current owner. Implemented `ownerOf` in terms of `_requireOwned`.
