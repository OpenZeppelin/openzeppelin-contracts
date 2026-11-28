---
'openzeppelin-solidity': patch
---

`GovernorPreventLateQuorum`: Allow deployment when the voting period is not yet set during construction, and cap the applied vote extension by `_maxLateQuorumVoteExtension` so the bound holds regardless of construction order.
