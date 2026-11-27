---
'openzeppelin-solidity': major
---

`Checkpoints`: Remove the latest checkpoint when an update at its key restores the previous checkpoint's value. After removal, `latestCheckpoint` reports the previous key, `lowerLookup` returns zero above that key until a later checkpoint is added, and the ordering check uses the last stored key.
