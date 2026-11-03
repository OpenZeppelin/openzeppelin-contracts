---
'openzeppelin-solidity': patch
---

`ERC7913P256Verifier`: reject signatures that are not exactly `0x40` or `0x41` bytes long. Previously the length was checked with `signature.length >= 0x40`, which contradicted the accompanying comment (`Signature length may be 0x40 or 0x41`) and accepted signatures with arbitrary trailing bytes. Since only the first `0x40` bytes are read, those trailing bytes were ignored, so the same signature could be re-encoded into many distinct byte strings that all verify.

