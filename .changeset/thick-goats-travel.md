---
'openzeppelin-solidity': patch
---

Optimize ReentrancyGuardTransient by pre-computing BooleanSlot wrapper to save 30 gas per call
