---
'openzeppelin-solidity': minor
---

`TransientSlot`: Add the `TAddress`, `TBoolean`, `TBytes32`, `TUint256` and `TInt256` structs, along with the corresponding `tload` and `tstore` functions. Declaring one of them as a state variable reserves a slot in the persistent storage layout whose number is then used in transient storage, delegating the allocation of transient slots to the compiler. This makes it possible to namespace transient slots, for example by reserving them inside an ERC-7201 namespaced storage struct.
