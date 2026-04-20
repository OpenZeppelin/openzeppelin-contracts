---
'openzeppelin-solidity': minor
---

`ERC7540Redeem`: Add implementation of the asynchronous redemption flow for ERC-7540. Supports requesting redemptions that transition through Pending and Claimable states before being claimed via `withdraw` and `redeem` functions.
