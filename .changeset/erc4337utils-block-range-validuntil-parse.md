---
'openzeppelin-solidity': patch
---

`ERC4337Utils`: fix `parseValidationData`, `packValidationData` and `PaymasterSigner` handling of `validUntil == 0` under `ValidationRange.BLOCK`.
