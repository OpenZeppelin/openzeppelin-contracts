---
sections:
  - title: Core
    contracts:
      - IERC1155
      - ERC1155
      - IERC1155MetadataURI
      - ERC1155MetadataURICatchAll
      - IERC1155Receiver
      - ERC1155Holder
---

This set of interfaces and contracts are all related to the [ERC1155 Multi Token Standard](https://eips.ethereum.org/EIPS/eip-1155).

The EIP consists of three interfaces which fulfill different roles, found here as `IERC1155`, `IERC1155MetadataURI` and `IERC1155Receiver`. Only `IERC1155` is required for a contract to be ERC1155 compliant. The basic functionality is implemented in `ERC1155`.

Additionally, `ERC1155MetadataURICatchAll` implements functionality for setting and querying a simple catch-all URI (i.e. one URI for all tokens, with the ID as a parameter) for metadata via the `IERC1155MetadataURI` interface.
`ERC1155Holder` implements the `IERC1155Receiver` interface for contracts that can receive (and hold) ERC1155 tokens.