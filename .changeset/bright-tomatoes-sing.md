---
'openzeppelin-solidity': major
---

`ERC20`, `ERC721`, `ERC1155`: Deleted `_beforeTokenTransfer` and `_afterTokenTransfer` hooks, added a new internal `_update` function for customizations, and refactored all extensions using those hooks to use `_update` instead. ([#3838](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/3838), [#3876](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/3876), [#4377](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/4377))
