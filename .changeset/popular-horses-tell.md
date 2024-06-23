---
'openzeppelin-solidity': minor
---

- Update `hashProposal()` visibility to view instead of pure to allow `address(this)` and `block.chainid` to be part of the `proposalId` computation if more uniqueness between different chains is desired
