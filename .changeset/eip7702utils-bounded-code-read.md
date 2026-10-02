---
'openzeppelin-solidity': patch
---

`EIP7702Utils`: Read only the first word of the account's code in `fetchDelegate` instead of copying the code in full, so the cost of the call no longer scales with the size of that code.
