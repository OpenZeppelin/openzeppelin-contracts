---
'openzeppelin-solidity': minor
---

`CrosschainRemoteExecutor`: Validate in `_setup` that the controller is a well-formed ERC-7930 (version 1) interoperable address with an address of the length expected for its chain type and no trailing bytes.
