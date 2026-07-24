---
'openzeppelin-solidity': patch
---

Return `false` from `pkcs1Sha256` instead of reverting when modular exponentiation fails (e.g. the precompile runs out of gas on oversized inputs).
