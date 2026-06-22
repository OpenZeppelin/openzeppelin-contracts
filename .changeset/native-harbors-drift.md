---
'openzeppelin-solidity': minor
---

`ERC7535`: Add an implementation of the ERC-7535 Native Asset Tokenized Vault standard as a thin extension of `ERC4626`, using the chain's native asset (e.g. Ether) as the underlying. `deposit` prices shares off the entire `msg.value` (ignoring its `assets` argument, per ERC-7535) and `mint` requires `msg.value` to cover the previewed cost (keeping any excess as a donation); withdrawals send the native asset out via `Address.sendValue` under the inherited checks-effects-interactions ordering, and a `virtual` `receive()` rejects unsolicited plain transfers.
