---
'openzeppelin-solidity': major
---

`Governor`: Add support for casting votes with ERC-1271 signatures by using a `bytes memory signature` instead of `r`, `s` and `v` arguments in the `castVoteBySig` and `castVoteWithReasonAndParamsBySig` functions.
