---
'openzeppelin-solidity': minor
---

`ERC4337Utils`: Add `initCodeHash(PackedUserOperation)`, that returns the hash of the useroperation's `initCode` where the marker used by EIP-7702 senders has been substituted with the delegate read from `sender.code`.
