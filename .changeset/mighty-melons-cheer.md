---
'openzeppelin-solidity': patch
---

`P256`: Fix precompile detection, avoiding revert in `verifyNative`, and reducing cost of `verify` when the signature is invalid.
