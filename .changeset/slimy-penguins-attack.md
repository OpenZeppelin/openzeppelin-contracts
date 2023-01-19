---
'openzeppelin-solidity': major
---

`TransparentUpgradeableProxy`: Removed `admin` and `implementation` getters, which were only callable by the proxy owner and thus not very useful. ([#3820](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/3820))
