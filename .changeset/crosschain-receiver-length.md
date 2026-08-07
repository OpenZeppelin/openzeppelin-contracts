---
'openzeppelin-solidity': minor
---

`BridgeFungible`, `BridgeNonFungible`, `BridgeMultiToken`: reject crosschain messages whose receiver address is not exactly 20 bytes instead of silently truncating via `bytes20`
