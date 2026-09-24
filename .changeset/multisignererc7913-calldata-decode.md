---
'openzeppelin-solidity': patch
---

`MultiSignerERC7913`: Decode the multisignature payload directly from calldata and return `false` on malformed encoding instead of reverting during `abi.decode`, so paymaster/account validation can surface `SIG_VALIDATION_FAILED` rather than bubble up a revert. The `_validateSignatures` and `_validateThreshold` override parameters change from `bytes[] memory` to `bytes[] calldata`.
