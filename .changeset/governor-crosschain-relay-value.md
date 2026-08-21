---
'openzeppelin-solidity': minor
---

[BREAKING] `GovernorCrosschain`: `relayCrosschain` is now `payable` and forwards its value to the ERC-7786 gateway, which some gateways charge as a message fee. It returns the gateway's `sendId`, which is also emitted in a new `CrosschainInstructionRelayed` event, so that messages needing further gateway processing can be tracked. `_crosschainExecute` takes an additional `value` argument and returns the `sendId`.
