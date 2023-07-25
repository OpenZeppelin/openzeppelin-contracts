---
'openzeppelin-solidity': patch
---

`ERC2771Context`: Returns the forwarder address whenever `msg.data.length` is not appended with an address (i.e. length is less than 20 bytes).
