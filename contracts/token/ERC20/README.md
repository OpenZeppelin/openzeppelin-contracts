---
sections:
  - title: Core
    contracts:
      - IERC20
      - ERC20
      - ERC20Detailed
  - title: Extensions
    contracts:
      - ERC20Mintable
      - ERC20Burnable
      - ERC20Pausable
      - ERC20Capped
  - title: Utilities
    contracts:
      - SafeERC20
      - TokenTimelock
---

This set of interfaces, contracts, and utilities are all related to the [ERC20 Token Standard](https://eips.ethereum.org/EIPS/eip-20).

*For a walkthrough on how to create an ERC20 token read our [ERC20 guide](../../tokens.md#constructing-a-nice-erc20-token).*

There a few core contracts that implement the behavior specified in the EIP: `IERC20`, `ERC20`, `ERC20Detailed`.

Additionally there are multiple extensions, including:
- designation of addresses that can create token supply (`ERC20Mintable`), with an optional maximum cap (`ERC20Capped`),
- destruction of own tokens (`ERC20Burnable`),
- designation of addresses that can pause token operations for all users (`ERC20Pausable`).

Finally, there are some utilities to interact with ERC20 contracts in various ways.
- `SafeERC20` is a wrapper around the interface that eliminates the need to handle boolean return values.
- `TokenTimelock` can hold tokens for a beneficiary until a specified time.

> This page is incomplete. We're working to improve it for the next release. Stay tuned!
