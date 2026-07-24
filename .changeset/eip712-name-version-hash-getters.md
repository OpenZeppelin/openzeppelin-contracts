---
'openzeppelin-solidity': minor
---

`EIP712`: Add internal `_EIP712NameHash` and `_EIP712VersionHash` getters and use them when building the domain separator. `ERC7739` now relies on these getters as well, making the domain derivation robust when the signer is used behind a proxy or clone with a name or version longer than 31 characters.
