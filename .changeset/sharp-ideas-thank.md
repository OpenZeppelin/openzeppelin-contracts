---
'openzeppelin-solidity': patch
---

`RSA`: Check the padding in `pkcs1Sha256` 32 bytes at a time instead of byte by byte.
