---
'openzeppelin-solidity': patch
---

`ERC4337Utils`: align `parseValidationData`, `packValidationData`, `getValidationData` and `combineValidationData` with how the EntryPoint reads a validity range. A zero `validUntil` ("indefinitely") is now resolved before the block-range flags are tested, and the flag is only stripped once a block range is detected, so a timestamp range with a residual flag is no longer silently turned into a plausible window. Also fixes `PaymasterSigner` handling of `validUntil == 0` under `ValidationRange.BLOCK`.
