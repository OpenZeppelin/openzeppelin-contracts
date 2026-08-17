---
'openzeppelin-solidity': patch
---

`CrosschainRemoteExecutor`: Validate that the controller is a full interoperable address (chain reference and address) in `_setup`. A controller that the gateway can never report as `sender` would permanently lock the executor and the assets it holds.
