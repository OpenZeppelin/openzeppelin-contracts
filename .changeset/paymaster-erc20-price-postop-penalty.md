---
'openzeppelin-solidity': patch
---

`PaymasterERC20`: Price the EntryPoint's unused-gas penalty on the user-controlled `paymasterPostOpGasLimit` into the token charge, preventing an inflated limit from draining the paymaster's deposit.
