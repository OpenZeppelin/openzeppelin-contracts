---
'openzeppelin-solidity': minor
---

[BREAKING] `GovernorCrosschain`: Make `relayCrosschain` payable, forwarding its value to the gateway, and return the gateway's `sendId`. `_crosschainExecute` now takes a `value` argument and returns the `sendId`.
