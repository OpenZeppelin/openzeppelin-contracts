---
'openzeppelin-solidity': patch
---

`PaymasterERC20Guarantor`: Return the effective `prefundAmount` propagated by `super._prefund` instead of the input amount, so extensions composed below the guarantor that pull less than requested serialize the actual pulled amount into the postOp context.
