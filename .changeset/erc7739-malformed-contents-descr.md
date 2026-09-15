---
'openzeppelin-solidity': patch
---

`ERC7739`: Reject signatures whose `contentsDescr` fails to parse into a non-empty `contentsName`, preventing a malformed descriptor from degrading verification to a constant `structHash` that no longer binds the message contents or the account's EIP-712 domain.
