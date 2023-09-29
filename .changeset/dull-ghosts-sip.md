---
'openzeppelin-solidity': patch
---

`AccessManager`, `AccessManaged`, `GovernorTimelockAccess`: Ensure that calldata shorter than 4 bytes is not padded to 4 bytes.
pr: #4624
