---
'openzeppelin-solidity': minor
---

`InteroperableAddress`: Add `isValidAddressLength` and `isValidAddressLengthCalldata` to check that an address has the expected length for its chain type (20 bytes for EVM, 32 bytes for Solana, non-empty otherwise). `BridgeFungible`, `BridgeNonFungible` and `BridgeMultiToken` now reject crosschain transfers to a destination whose address has an invalid length, and `CrosschainLinked` reverts with `InteroperableAddressParsingError` when registering a counterpart whose address is empty or has an invalid length.
