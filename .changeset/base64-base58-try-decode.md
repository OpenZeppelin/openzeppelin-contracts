---
'openzeppelin-solidity': minor
---

`Base64` and `Base58`: Add `tryDecode`, a variant of `decode` that returns a `bool success` flag instead of reverting when the input contains a character outside the alphabet.
