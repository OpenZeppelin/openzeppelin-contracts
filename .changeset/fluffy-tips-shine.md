---
'openzeppelin-solidity': major
---

[BREAKING] `IVotes` and `IERC5805`: Add the `draft-` prefix since ERC-5805 is not finalized and merge the `IVotes` interface into it. Usages must be updated from `IVotes` to `IERC5805`. Imports must be changed from `governance/utils/IVotes.sol` or `interfaces/IERC5805.sol` to `interfaces/draft-IERC5805.sol`.
