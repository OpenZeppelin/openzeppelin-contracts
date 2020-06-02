---
sections:
  - title: Core
    contracts:
      - IERC1155
      - IERC1155MetadataURI
      - ERC1155
      - IERC1155Receiver
      - ERC1155Holder
---

This set of interfaces and contracts are all related to the [ERC1155 Multi Token Standard](https://eips.ethereum.org/EIPS/eip-1155).

The EIP consists of three interfaces which fulfill different roles, found here as `IERC1155`, `IERC1155MetadataURI` and `IERC1155Receiver`.

`ERC1155` implement the mandatory `IERC1155` interface, as well as the optional extension `IERC1155MetadataURI` by relying on the substition mechanism to use the same URI for all token types, dramatically reducing gas costs.

`ERC1155Holder` implements the `IERC1155Receiver` interface for contracts that can receive (and hold) ERC1155 tokens.
