---
'openzeppelin-solidity': major
---

`Governor`: Add `voter` and `nonce` parameters in signed ballots, to avoid forging signatures for random addresses, prevent signature replay, and allow invalidating signatures. Add `voter` as a new parameter in the `castVoteBySig` and `castVoteWithReasonAndParamsBySig` functions.
