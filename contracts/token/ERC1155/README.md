---
sections:
  - title: Core
    contracts:
      - IERC1155
      - ERC1155
      - IERC1155TokenReceiver
---

This set of interfaces and contracts are all related to the [ERC1155 Multi Token Standard](https://eips.ethereum.org/EIPS/eip-1155).

The EIP consists of two interfaces which fulfill different roles, found here as `IERC1155`  and `IERC1155TokenReceiver`. Only `IERC1155` is required for a contract to be ERC1155 compliant. The basic functionality is implemented in `ERC1155`.
