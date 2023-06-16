---
'openzeppelin-solidity': major
---

Replaces `toString(int256)` with `toStringSigned(int256)`

# WHAT the breaking change is?

- The toString(int256) is now replaced with toStringSigned(int256)

# WHY the change was made?

- The change was made as invoking `toString(int256)` with an integer literal from another contract was failing with the error `Member "toString" not unique` since `toString(1)` qualifies for both int256 & uint256, hence replaced `toString(int256)` with `toStringSigned(int256)`.

# HOW a consumer should update their code?

- Replace the instances of `toString(int256)` with `toStringSigned(int256)`.
