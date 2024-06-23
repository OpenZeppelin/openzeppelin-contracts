---
'openzeppelin-solidity': minor
---

- update `hashProposal()` visibility to view instead of pure to allow `address(this)` and `block.chainid` to be part of the proposal id computation if more uniqueness between different chains is desired
