---
'openzeppelin-solidity': major
---

`GovernorStorage`: Added a new governor extension that stores the proposal details in storage, with an interface that operates on `proposalId`, as well as proposal enumerability. This replaces the old `GovernorCompatibilityBravo` module.
