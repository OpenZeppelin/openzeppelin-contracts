---
'openzeppelin-solidity': patch
---

`ERC2771Context`: Prevent revert in `_msgData()` when a call originating from a trusted forwarder is not long enough to contain the request signer address (i.e. `msg.data.length` is less than 20 bytes). Return the full calldata in that case.
