---
'openzeppelin-solidity': minor
---

`IERC4626`: Move the vault functions and events to a new `IERC4626Core` interface that `IERC4626` inherits, so `type(IERC4626).interfaceId` is now `0x00000000` and NatSpec that inherits documentation for these functions from `IERC4626` must now reference `IERC4626Core` instead.
