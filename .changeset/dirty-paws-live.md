---
'openzeppelin-solidity': minor
---

`PaymasterERC20Guarantor`: Raise the default `_guaranteedPostOpCost()` from 15_000 to 35_000 to cover the EIP-8038 (Glamsterdam) repricing of the storage writes done when pulling the cost from the user.
