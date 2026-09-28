---
'openzeppelin-solidity': minor
---

[BREAKING] `BridgeFungible`, `BridgeNonFungible` and `BridgeMultiToken`: custom errors `CrosschainFungibleEmptyAddress`, `CrosschainNonFungibleEmptyAddress` and `CrosschainMultiTokenEmptyAddress` have been renamed to `CrosschainFungibleInvalidAddress`, `CrosschainNonFungibleInvalidAddress` and `CrosschainMultiTokenInvalidAddress`. They are now also triggered when the address part of the destination has an invalid length for its chain type.
