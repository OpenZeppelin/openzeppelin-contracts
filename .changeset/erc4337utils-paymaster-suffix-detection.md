---
'openzeppelin-solidity': patch
---

`ERC4337Utils`: Only treat the tail of `paymasterAndData` as a paymaster signature suffix in `paymasterData` and `paymasterSignature` when `paymasterAndData` is at least 62 bytes long and declares a non-zero signature length, matching the EntryPoint v0.9 `getSignedPaymasterData`. Previously `paymasterData` returned empty data for a 52 to 61 byte `paymasterAndData` ending with the magic, and stripped a suffix with a zero-length signature.
