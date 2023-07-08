---
'openzeppelin-solidity': patch
---

`BeaconProxy`: Use an immutable variable to store the address of the beacon. It is no longer possible for a `BeaconProxy` to upgrade by changing to another beacon.
