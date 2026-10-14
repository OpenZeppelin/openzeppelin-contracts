// contracts/AccessControlModified.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {AccessControl} from "../../../access/AccessControl.sol";

contract AccessControlModified is AccessControl {
    error AccessControlNonRevocable();

    // Override the revokeRole function
    function revokeRole(bytes32, address) public pure override {
        revert AccessControlNonRevocable();
    }
}
