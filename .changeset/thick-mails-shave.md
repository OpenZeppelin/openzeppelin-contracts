---
'openzeppelin-solidity': patch
---

`SignatureChecker`: Zero-pad the ERC-1271 signature calldata to a 32-byte boundary when performing the ERC-1271 static call, so the encoded `bytes` argument conforms to the ABI spec.
