# Engineering Guidelines

... [previous content remains the same until the custom errors section]

* Custom errors should be declared following the [EIP-6093](https://eips.ethereum.org/EIPS/eip-6093) rationale whenever reasonable. Also, consider the following:
  
  * The domain prefix should be picked in the following order:
    1. Use `ERC<number>` if the error is a violation of an ERC specification.
    2. Use the name of the underlying component where it belongs (eg. `Governor`, `ECDSA`, or `Timelock`).

... [rest of the content remains the same]