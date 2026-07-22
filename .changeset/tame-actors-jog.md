---
'openzeppelin-solidity': minor
---

`MessageHashUtils`: Add a `domainBytes` function that abi-encodes the EIP-712 domain fields, and use it in `ERC7739` to build the `TypedDataSign` domain payload.
