---
'openzeppelin-solidity': major
---

`ERC20` does not emit an `Approval` event when `transferFrom` consumes part of the approval. With this change, allowances are no longer reconstructible from events. See the code for guidelines on how to re-enable this event.
