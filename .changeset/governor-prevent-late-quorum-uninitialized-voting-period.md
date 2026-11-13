---
'openzeppelin-solidity': patch
---

`GovernorPreventLateQuorum`: Allow deployment when `votingPeriod()` is not yet initialized during construction (e.g. when `GovernorSettings` is inherited after `GovernorPreventLateQuorum` or when `votingPeriod()` reads an immutable assigned in the child constructor).
