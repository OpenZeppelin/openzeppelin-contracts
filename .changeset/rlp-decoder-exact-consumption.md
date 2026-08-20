---
'openzeppelin-solidity': patch
---

`RLP`: Reject trailing bytes in `readUint256`, `readBytes`, and derived decoders (`readBool`, `readBytes32`, `readAddress`, `readString`, `decodeXxx`).
