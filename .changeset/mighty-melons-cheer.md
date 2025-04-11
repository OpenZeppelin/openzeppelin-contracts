---
'openzeppelin-solidity': patch
---

`P256`: Adjust precompile detection in `verifyNative` to consider empty `returndata` on invalid verification. Previously, invalid signatures would've reverted with a `MissingPrecompile` error in chains with RIP-7212 support.
