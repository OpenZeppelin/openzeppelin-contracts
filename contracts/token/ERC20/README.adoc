= ERC 20

This set of interfaces, contracts, and utilities are all related to the https://eips.ethereum.org/EIPS/eip-20[ERC20 Token Standard].

TIP: For an overview of ERC20 tokens and a walkthrough on how to create a token contract read our xref:ROOT:erc20.adoc[ERC20 guide].

There a few core contracts that implement the behavior specified in the EIP:

* {IERC20}: the interface all ERC20 implementations should conform to.
* {ERC20}: the implementation of the ERC20 interface, including the <<ERC20-name,`name`>>, <<ERC20-symbol,`symbol`>> and <<ERC20-decimals,`decimals`>> optional standard extension to the base interface.

Additionally there are multiple custom extensions, including:

* designation of addresses that can pause token transfers for all users ({ERC20Pausable}).
* efficient storage of past token balances to be later queried at any point in time ({ERC20Snapshot}).
* destruction of own tokens ({ERC20Burnable}).
* enforcement of a cap to the total supply when minting tokens ({ERC20Capped}).

Finally, there are some utilities to interact with ERC20 contracts in various ways.

* {SafeERC20} is a wrapper around the interface that eliminates the need to handle boolean return values.
* {TokenTimelock} can hold tokens for a beneficiary until a specified time.

== Core

{{IERC20}}

{{ERC20}}

== Extensions

{{ERC20Snapshot}}

{{ERC20Pausable}}

{{ERC20Burnable}}

{{ERC20Capped}}

== Utilities

{{SafeERC20}}

{{TokenTimelock}}
