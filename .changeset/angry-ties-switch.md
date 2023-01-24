---
'openzeppelin-solidity': major
---

`TimelockController`: Changed the role architecture to use `DEFAULT_ADMIN_ROLE` as the admin for all roles, instead of the bespoke `TIMELOCK_ADMIN_ROLE` that was used previously. This aligns with the general recommendation for `AccessControl` and makes the addition of new roles easier. Accordingly, the `admin` parameter and timelock will now be granted `DEFAULT_ADMIN_ROLE` instead of `TIMELOCK_ADMIN_ROLE`. ([#3799](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/3799))
