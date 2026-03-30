---
'openzeppelin-solidity': minor
---

`ERC7540Deposit`: Add implementation of the asynchronous deposit flow for ERC-7540. Supports requesting deposits that transition through Pending and Claimable states before being claimed via standard ERC-4626 `deposit` and `mint` functions.
