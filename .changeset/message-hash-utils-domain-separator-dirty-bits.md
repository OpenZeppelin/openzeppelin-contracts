---
'openzeppelin-solidity': patch
---

`MessageHashUtils`: `toDomainSeparator` now cleans the upper bits of `verifyingContract`. Previously, an address with dirty upper 96 bits produced a domain separator that differed from the one computed with `abi.encode`.
