---
'openzeppelin-solidity': patch
---

`TrieProof`: Return `ProofError.INVALID_PROOF` from `tryTraverse` (and `false` from `verify`) when the traversal reaches an empty branch child, instead of reverting with `RLPInvalidEncoding`. This is the shape of the proof returned by `eth_getProof` for a key that is not in the trie.
