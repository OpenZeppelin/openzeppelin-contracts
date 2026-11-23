---
'openzeppelin-solidity': minor
---

[Breaking change] `AccessManager`: Fix `_canCancel` so that scheduled `grantRole` and `revokeRole` operations can be canceled by guardians of the role's admin rather than by any member of the admin role. The incorrect behavior was introduced in v5.7.
