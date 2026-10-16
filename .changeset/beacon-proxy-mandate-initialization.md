---
'openzeppelin-solidity': major
---

[BREAKING] `BeaconProxy`: Mandate initialization during construction. Deployment now reverts with `BeaconProxyUninitialized` if an initialize call is not provided. Developers that rely on the previous behavior and want to disable this check can do so by overriding the internal `_unsafeAllowUninitialized` function to return true.
