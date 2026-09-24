---
'openzeppelin-solidity': patch
---

`GovernorTimelockCompound`: Reject proposals containing duplicate actions at submission time with a new `GovernorTimelockCompoundDuplicateProposalAction` error, instead of failing at queue time.
