---
'openzeppelin-solidity': minor
---

Added mock contract boilerplate code for usage in testing. This includes:

- `MockERC20.sol`: A simple ERC20 implementation with mint and burn functions
- `MockERC721.sol`: A simple ERC721 implementation with mint, safeMint, and burn functions

These mock contracts are placed in the `contracts/testing/token/` directory and are intended for developers to use in their tests without having to create their own implementations. This addresses issue #5491.
