// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {AccessControl} from "../AccessControl.sol";

/**
 * @dev Extension of {AccessControl} that allows batch granting and revoking of roles.
 *
 * This extension is OPTIONAL and does not modify the core AccessControl behavior.
 */
abstract contract AccessControlBatch is AccessControl {
    /**
     * @dev Grants multiple roles to multiple accounts in a single transaction.
     *
     * Requirements:
     * - caller must have {DEFAULT_ADMIN_ROLE}.
     * - roles.length == accounts.length
     */
    function grantRoles(bytes32[] calldata roles, address[] calldata accounts) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (roles.length != accounts.length) {
            revert("AccessControlBatch: length mismatch");
        }

        for (uint256 i = 0; i < roles.length; ++i) {
            address account = accounts[i];
            if (account == address(0)) {
                revert("AccessControlBatch: invalid account");
            }
            _grantRole(roles[i], account);
        }
    }

    /**
     * @dev Revokes multiple roles from multiple accounts in a single transaction.
     *
     * Requirements:
     * - caller must have {DEFAULT_ADMIN_ROLE}.
     * - roles.length == accounts.length
     */
    function revokeRoles(bytes32[] calldata roles, address[] calldata accounts) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (roles.length != accounts.length) {
            revert("AccessControlBatch: length mismatch");
        }

        for (uint256 i = 0; i < roles.length; ++i) {
            address account = accounts[i];
            if (account == address(0)) {
                revert("AccessControlBatch: invalid account");
            }
            _revokeRole(roles[i], account);
        }
    }
}
