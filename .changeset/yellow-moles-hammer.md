---
'openzeppelin-solidity': minor
---

`SignatureChecker`: refactor `isValidSignatureNow` to avoid validating ECDSA signatures if there is code deployed at the signer's address.
