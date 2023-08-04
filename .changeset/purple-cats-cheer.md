---
'openzeppelin-solidity': major
---

`GovernorTimelockControl`: Add the Governor instance address as part of the TimelockController operation `salt` to avoid operation id collisions between governors using the same TimelockController.
