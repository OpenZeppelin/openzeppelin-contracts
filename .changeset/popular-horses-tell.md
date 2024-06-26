---
'openzeppelin-solidity': minor
---

- `Governor`: Change `hashProposal()` visibility to view to allow `address(this)` and `block.chainid` to be part of the `proposalId` computation if more uniqueness between different chains is desired

---
