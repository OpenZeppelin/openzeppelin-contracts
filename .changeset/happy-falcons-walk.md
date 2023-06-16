---
'openzeppelin-solidity': major
---

`TransparentUpgradeableProxy`: Admin is now stored in an immutable variable (set during construction) to avoid unnecessary storage reads on every proxy call. This removed the ability to ever change the admin. Transfer of the upgrade capability is exclusively handled through the ownership of the `ProxyAdmin`.
