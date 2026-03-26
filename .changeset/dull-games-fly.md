---
'openzeppelin-solidity': patch
---

ERC2771Forwarder: `executeBatch` with `refundReceiver == address(0)` now refunds failed-execution value to `msg.sender` instead of reverting, preventing ETH from being burned
