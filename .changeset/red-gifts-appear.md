---
'openzeppelin-solidity': patch
---

`InteroperableAddress`: Fix `uint8` overflow in `tryParseV1` and `tryParseV1Calldata` that caused silent incorrect parsing when `chainReference` and `addr` lengths summed to 250 or more, returning an empty address with `success = true` instead of reverting.
