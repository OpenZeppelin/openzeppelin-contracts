---
'openzeppelin-solidity': patch
---

`GovernorTimelockCompound`: reject proposals with duplicate actions before queueing to avoid creating proposals that can only fail later at queue time.
