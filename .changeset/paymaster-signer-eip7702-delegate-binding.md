---
'openzeppelin-solidity': patch
---

`PaymasterSigner`: Bind the signable digest to the effective EIP-7702 delegate. For senders whose `initCode` starts with the 20-byte `0x7702` marker, the `initCode` component of the digest is now the delegate read from `userOp.sender`'s code (padded with the trailing initialization data), mirroring the `IEntryPoint`'s `userOpHash` computation. Sponsorship signatures for non-EIP-7702 senders are unchanged.
