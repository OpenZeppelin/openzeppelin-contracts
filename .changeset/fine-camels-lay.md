---
'openzeppelin-solidity': major
---

[BREAKING] `Context`, `ERC2771Context` and `ERC2771Forwarder`: Remove these contracts and the ERC-2771 meta-transaction support that depended on `Context`. Base contracts now read the caller and calldata directly through `msg.sender`/`msg.data`, and the `_msgSender()`, `_msgData()` and `_contextSuffixLength()` hooks are removed. Downstream contracts that relied on these hooks must be updated.
