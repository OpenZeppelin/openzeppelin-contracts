---
'openzeppelin-solidity': major
---

`UUPSUpgradeable`, `TransparentUpgradeableProxy` and `ProxyAdmin`: Removed `upgradeTo` and `upgrade` functions, and made `upgradeToAndCall` and `upgradeAndCall` ignore the data argument if it is empty. It is no longer possible to invoke the receive function (or send value with empty data) along with an upgrade.
