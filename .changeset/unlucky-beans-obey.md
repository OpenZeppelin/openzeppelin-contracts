---
'openzeppelin-solidity': patch
---

`ERC2771Context`: Return the forwarder address whenever `msg.data.length` is not appended with the request signer address (i.e. length is less than 20 bytes).
