---
'openzeppelin-solidity': minor
---

`PaymasterSigner`: For EIP-7702 senders, the signable digest now binds the effective delegate (from `sender.code`) instead of the raw `0x7702` marker, matching the `IEntryPoint`'s `userOpHash`. Sponsorship signers must be updated in lockstep or existing flows break silently; see the paymasters guide.
