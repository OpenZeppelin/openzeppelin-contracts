---
'openzeppelin-solidity': major
---

[BREAKING] `ERC1155`: Reorder the `_balances` mapping keys from `(id, account)` to `(account, id)` to match `balanceOf`. This changes the storage layout and requires migration in upgradeable contexts.
