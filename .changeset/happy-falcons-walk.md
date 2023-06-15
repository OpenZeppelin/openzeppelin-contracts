---
'openzeppelin-solidity': major
---

`TransparentUpgradeableProxy`: Added an immutable admin set during construction to avoid unnecessary storage reads on every proxy call, and removed the ability to change the admin from both proxy and `ProxyAdmin`
