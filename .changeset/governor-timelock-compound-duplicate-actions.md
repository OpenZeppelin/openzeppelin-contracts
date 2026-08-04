---
'openzeppelin-solidity': minor
---

`GovernorTimelockCompound`: Reject proposals containing duplicate actions (same target, value, and calldata) at proposal creation time with a new `GovernorDuplicateProposalAction` error, rather than failing later during queueing.
