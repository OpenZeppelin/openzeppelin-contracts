---
'openzeppelin-solidity': patch
---

`Arrays`: `sort(address[])` now compares entries on their lower 160 bits. Previously the array was reinterpreted as `uint256[]` and compared word-for-word, so entries whose upper 96 bits were dirty were ordered incorrectly.
