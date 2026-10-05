---
'openzeppelin-solidity': patch
---

`ERC4337Utils`: in `parseValidationData`, resolve `validUntil == 0` to `type(uint48).max` and only strip `BLOCK_RANGE_FLAG` when a block range is detected. Propagates to `packValidationData`, `getValidationData`, `combineValidationData` and `PaymasterSigner`, matching the EntryPoint's behavior.
