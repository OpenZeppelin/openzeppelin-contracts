---
'openzeppelin-solidity': minor
---

`InteroperableAddress`: Add `isValidAddressLength` and `isValidAddressLengthCalldata` to check that an address, or an address length, matches the expected length for its chain type (20 bytes for EVM, 32 bytes for Solana, non-empty otherwise).
