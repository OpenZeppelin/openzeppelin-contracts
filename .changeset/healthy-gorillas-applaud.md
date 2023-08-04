---
'openzeppelin-solidity': major
---

`VestingWallet`: Use Ownable2Step instead of an immutable `beneficiary`. The initial owner is set to the benefactor (`msg.sender`) but transferred to the beneficiary address so that unclaimed tokens can be recovered by the benefactor.
