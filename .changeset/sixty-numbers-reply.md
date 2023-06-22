---
'openzeppelin-solidity': major
---

`Governor`: Add a `voter` parameter to the `castVoteBySig` and `castVoteWithReasonAndParamsBySig` functions to avoid forging signatures for random addresses and allow the use of an internal nonce for invalidating signatures.
