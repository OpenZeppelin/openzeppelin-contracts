---
'openzeppelin-solidity': patch
---

`Base64`: Validate the last character of inputs whose length is `4k+1`. `decode` now reverts with `InvalidBase64Char`, and `tryDecode` returns `false`, if that character is outside the Base64 (or Base64Url) alphabet.
