---
'openzeppelin-solidity': patch
---

`BridgeFungible`, `BridgeNonFungible` and `BridgeMultiToken`: reject crosschain destinations whose address part is not exactly 20 bytes, preventing malformed ERC-7930 addresses from being silently padded or truncated when converted to an EVM address on receipt.
