---
'openzeppelin-solidity': major
---

Overrides are now used internally for a number of functions that were previously hardcoded to their default implementation in certain locations: `ERC1155Supply.totalSupply`, `ERC721.ownerOf`, `ERC721.balanceOf` in `ERC721Enumerable`, and `ERC20.totalSupply` in `ERC20FlashMint`.
