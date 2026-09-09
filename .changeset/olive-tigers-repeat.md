---
'openzeppelin-solidity': minor
---

`PaymasterERC20`: Charge the EntryPoint unused-gas penalty only on the part of `paymasterPostOpGasLimit` that exceeds the new `_postOpGasBudget` virtual, instead of on the whole limit. Gas the paymaster already bills through `_postOpCost` (widened by `_guaranteedPostOpCost` in `PaymasterERC20Guarantor`) is no longer billed a second time as a penalty. `_postOpGasPenalty` now takes an upper bound on the unused gas rather than the limit, and no longer claims the EntryPoint's 40_000 gas threshold relief.
