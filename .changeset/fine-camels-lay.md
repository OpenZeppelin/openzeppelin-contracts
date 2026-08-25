---
'openzeppelin-solidity': major
---

[BREAKING] Remove the `Context` abstraction (`utils/Context.sol`) and the ERC-2771 meta-transaction support that depended on it (`metatx/ERC2771Context.sol`, `metatx/ERC2771Forwarder.sol`). All base contracts now read the caller and calldata directly via `msg.sender`/`msg.data`, and the `_msgSender()`, `_msgData()`, and `_contextSuffixLength()` override hooks are removed. Downstream contracts that relied on these hooks (e.g. for meta-transaction sender resolution) must be updated.
