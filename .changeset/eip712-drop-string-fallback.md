---
'openzeppelin-solidity': minor
---

`EIP712`: Drop the storage fallback for long `name`/`version` values. Both parameters must now fit in a `ShortString` (at most 31 bytes) or the constructor reverts with `ShortStrings.StringTooLong`. Storing the domain exclusively in immutables keeps the domain (and downstream `ERC7739` verification) consistent when the contract is used behind a proxy or clone without an initializer.
