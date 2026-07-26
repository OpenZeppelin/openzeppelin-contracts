---
'openzeppelin-solidity': minor
---

`BridgeERC1155`, `ERC1155Crosschain`: Add optional `data` parameter to `crosschainTransferFrom` overloads and plumb it through `BridgeMultiToken`'s ERC-7786 payload so it reaches the destination-chain ERC-1155 receiver's acceptance hook. Existing signatures continue to work with empty `data`. The `CrosschainMultiTokenTransferSent` and `CrosschainMultiTokenTransferReceived` events gain a `bytes data` field; `_onSend`/`_onReceive` override signatures now include `bytes memory data`.
