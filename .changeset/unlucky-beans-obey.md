---
'openzeppelin-solidity': patch
---

`ERC2771Context`: Return the forwarder address whenever the `msg.data` or calls sent by a trusted forwarder is not long enough to contain the request signer address (i.e. `msg.data.length` is less than 20 bytes).
