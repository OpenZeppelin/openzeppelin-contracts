---
'openzeppelin-solidity': minor
---

`ERC7535`: Add an implementation of the ERC-7535 Native Asset Tokenized Vault standard as a thin extension of `ERC4626`, using the chain's native asset (e.g. Ether) as the underlying. `deposit`/`mint` accept the native asset as `msg.value` (requiring it to cover the deposit, with any excess kept as a donation), withdrawals send it out via `Address.sendValue` under the inherited checks-effects-interactions ordering, and a `virtual` `receive()` rejects unsolicited plain transfers.
