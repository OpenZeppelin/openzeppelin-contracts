---
'openzeppelin-solidity': major
---

`GovernorTimelockCompound`: Support executing a single proposal that repeats the same action multiple times. Each action is now queued with its own eta, offset by one second per index.
