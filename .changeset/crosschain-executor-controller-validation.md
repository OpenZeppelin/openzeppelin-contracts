---
'openzeppelin-solidity': patch
---

`CrosschainRemoteExecutor`: Validate in `_setup` that the controller is a well-formed ERC-7930 (version 1) interoperable address with no trailing bytes.
