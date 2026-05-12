---
'openzeppelin-solidity': patch
---

optimize RSA padding check to use 32-byte word reads instead of bytr-by-byte, reducing ~202 iterations to ~7 for 2048-bit keys
