---
'openzeppelin-solidity': minor
---

`BridgeFungible`, `BridgeNonFungible`, `BridgeMultiToken`: reject EVM receivers that are not exactly 20 non-zero bytes on both send and receive (wrong-length send would lock funds against the length-checked receive path; `bytes20` truncation and unlock-to-zero are irreversible mis-deliveries)
