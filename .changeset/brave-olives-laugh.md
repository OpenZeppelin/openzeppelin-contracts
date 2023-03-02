---
'openzeppelin-solidity': patch
---

`ERC721Consecutive`: Fixed a bug when `_mintConsecutive` is used for batches of size 1 that could lead to balance overflow. Refer to the breaking changes section in the changelog for a note on the behavior of `ERC721._beforeTokenTransfer`.
