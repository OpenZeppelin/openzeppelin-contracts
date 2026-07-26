---
'openzeppelin-solidity': patch
---

`GovernorPreventLateQuorum`: Cap the extended deadline computed in `_tallyUpdated` by a new internal virtual `_maxExtendedDeadline` (default `type(uint48).max`), and compute the sum in `uint256` before clamping. Prevents a `clock() + lateQuorumVoteExtension()` overflow from reverting quorum-reaching votes and bricking governance. Integrators can override `_maxExtendedDeadline` to enforce a shorter cap.
