---
'openzeppelin-solidity': patch
---

`forceApprove` gas optimization: skip second approval call whenever `value == 0`.
