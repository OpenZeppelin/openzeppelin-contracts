---
'openzeppelin-solidity': major
---

`ERC20`: Remove `Approval` event previously emitted in `transferFrom` to indicate that part of the allowance was consumed. With this change, allowances are no longer reconstructible from events. See the code for guidelines on how to re-enable this event if needed.
