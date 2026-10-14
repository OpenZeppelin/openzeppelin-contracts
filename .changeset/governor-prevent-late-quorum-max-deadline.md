---
'openzeppelin-solidity': patch
---

`GovernorPreventLateQuorum`: Bound `lateQuorumVoteExtension` by a new internal virtual `_maxLateQuorumVoteExtension` (default `votingPeriod()`) to cap the total voting duration to twice the voting period, thus preventing a large extension from bricking governance. Integrators can override `_maxLateQuorumVoteExtension` to enforce a different bound.
