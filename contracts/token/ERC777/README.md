---
sections:
  - title: Core
    contracts:
      - IERC777
      - ERC777
  - title: Hooks
    contracts:
      - IERC777Sender
      - IERC777Recipient
---

This set of interfaces and contracts are all related to the [ERC777 token standard](https://eips.ethereum.org/EIPS/eip-777).

The token behavior itself is implemented in the core contracts: `IERC777`, `ERC777`.

Additionally there are interfaces used to develop contracts that react to token movements: `IERC777Sender`, `IERC777Recipient`.
