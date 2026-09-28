---
'openzeppelin-solidity': patch
---

`MessageHashUtils`: Reject unsupported ERC-5267 field bits when building EIP-712 domain type hashes and separators. The `ERC5267ExtensionsNotSupported` error is replaced by `ERC5267UnsupportedFields(bytes1 fields)`.
