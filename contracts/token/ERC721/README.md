---
sections:
  - title: Core
    contracts:
      - IERC721
      - ERC721
      - IERC721Metadata
      - ERC721Metadata
      - ERC721Enumerable
      - IERC721Enumerable
      - IERC721Full
      - ERC721Full
      - IERC721Receiver
  - title: Extensions
    contracts:
      - ERC721Mintable
      - ERC721MetadataMintable
      - ERC721Burnable
      - ERC721Pausable
  - title: Convenience
    contracts:
      - ERC721Holder
---

This set of interfaces, contracts, and utilities are all related to the [ERC721 Non-Fungible Token Standard](https://eips.ethereum.org/EIPS/eip-721).

*For a walkthrough on how to create an ERC721 token read our [ERC721 guide](../../tokens.md#erc721).*

The EIP consists of three interfaces, found here as `IERC721`,
`IERC721Metadata`, and `IERC721Enumerable`. Only the first one is required in a
contract to be ERC721 compliant. Each interface is implemented separately in
`ERC721`, `ERC721Metadata`, and `ERC721Enumerable`. You can choose the subset
of functionality you would like to support in your token by combining the
desired subset through inheritance. The fully featured token implementing all
three interfaces is prepackaged as `ERC721Full`.

> This page is incomplete. We're working to improve it for the next release. Stay tuned!
