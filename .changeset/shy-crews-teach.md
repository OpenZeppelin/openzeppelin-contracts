---
'openzeppelin-solidity': patch
---

`MerkleProof`: Fix a bug in `processMultiProof` and `processMultiProofCalldata` that allows proving arbitrary leaves if the tree contains a node with value 0 at depth 1.
