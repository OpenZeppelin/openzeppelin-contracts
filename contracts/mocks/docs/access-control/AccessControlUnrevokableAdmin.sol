// contracts/AccessControlNonRevokableAdmin.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {AccessControl} from "../../../access/AccessControl.sol";

contract AccessControlNonRevokableAdmin is AccessControl {
    error AccessControlNonRevokable();

    function revokeRole(bytes32 role, address account) public override {
        if (role == DEFAULT_ADMIN_ROLE) {
            revert AccessControlNonRevokable();
        }

        super.revokeRole(role, account);
    }
}
