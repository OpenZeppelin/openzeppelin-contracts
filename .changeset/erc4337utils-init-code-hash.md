---
'openzeppelin-solidity': minor
---

`ERC4337Utils`: Add `initCodeHash(PackedUserOperation)`, returning the `initCode` component of the {IEntryPoint}'s `userOpHash`. For EIP-7702 senders the marker is substituted with the delegate read from `sender.code`; for all other senders it is `keccak256(userOp.initCode)`. `PaymasterSigner` now uses this helper. Pragma bumped to `^0.8.24` (required by `Bytes`/`Memory`).
