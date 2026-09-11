---
'openzeppelin-solidity': minor
---

`Base64` and `Base58`: Add `tryDecode`, a non-reverting variant of `decode` that returns a `bool success` flag alongside the decoded buffer instead of reverting.
