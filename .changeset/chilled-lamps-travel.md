---
'openzeppelin-solidity': patch
---

`ReentrancyGuard`: Set `_NOT_ENTERED` to `1` and `_ENTERED` to `0` and update the `_status` inequality check to save gas. ([#4133]([#3714](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/4133)))
