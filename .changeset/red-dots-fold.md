---
'openzeppelin-solidity': major
---

Overrides are now used internally for a number of functions that were previously hardcoded to their default implementation in certain locations: `ERC1155Supply.totalSupply`, `ERC721.ownerOf`, `ERC721.balanceOf` and `ERC721.totalSupply` in `ERC721Enumerable`, `ERC20.totalSupply` in `ERC20FlashMint`, and `ERC1967._getImplementation` in `ERC1967Proxy`.
