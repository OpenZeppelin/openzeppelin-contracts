// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts v4.6.0 (governance/TimelockControllerWith46Migration.sol)

pragma solidity ^0.8.0;

import "./TimelockController.sol";

/**
 * @dev Extension of the TimelockController that includes an additional
 * function to migrate from OpenZeppelin Upgradeable Contracts <4.6 to >=4.6.
 *
 * This migration is necessary to setup administration rights over the new
 * `CANCELLER_ROLE`.
 *
 * The migration is trustless and can be performed by anyone.
 *
 * _Available since v4.6._
 */
contract TimelockControllerWith46Migration is TimelockController {
    constructor(
        uint256 minDelay,
        address[] memory proposers,
        address[] memory executors,
        address admin
    ) TimelockController(minDelay, proposers, executors, admin) {}

    /**
     * @dev Migration function. Running it is necessary for upgradeable
     * instances that were initially setup with code <4.6 and that upgraded
     * to >=4.6.
     */
    function migrateTo46() public virtual {
        require(
            getRoleAdmin(PROPOSER_ROLE) == TIMELOCK_ADMIN_ROLE && getRoleAdmin(CANCELLER_ROLE) == DEFAULT_ADMIN_ROLE,
            "TimelockController: already migrated"
        );
        _setRoleAdmin(CANCELLER_ROLE, TIMELOCK_ADMIN_ROLE);
    }
}
