---
'openzeppelin-solidity': patch
---

`PaymasterERC20Guarantor`: Reject guaranteed user operations whose `paymasterPostOpGasLimit` cannot cover the guaranteed refund, preventing an under-provisioned limit from stranding the guarantor's prefund.
