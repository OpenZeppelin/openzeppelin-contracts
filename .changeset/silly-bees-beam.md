---
'openzeppelin-solidity': major
---

`ERC20Votes`: Changed internal vote accounting to reusable `Votes` module previously used by `ERC721Votes`. Removed implicit `ERC20Permit` inheritance. Note that the `DOMAIN_SEPARATOR` getter was previously guaranteed to be available for `ERC20Votes` contracts, but is no longer available unless `ERC20Permit` is explicitly used; ERC-5267 support is included in `ERC20Votes` with `EIP712` and is recommended as an alternative.

pr: #3816
