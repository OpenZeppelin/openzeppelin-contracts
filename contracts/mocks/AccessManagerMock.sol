// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {AccessManager} from "../access/manager/AccessManager.sol";
import {AccessManagerEnumerable} from "../access/manager/extensions/AccessManagerEnumerable.sol";

contract AccessManagerMock is AccessManager {
    event CalledRestricted(address caller);
    event CalledUnrestricted(address caller);

    constructor(address initialAdmin) AccessManager(initialAdmin) {}

    function fnRestricted() public onlyAuthorized {
        emit CalledRestricted(msg.sender);
    }

    function fnUnrestricted() public {
        emit CalledUnrestricted(msg.sender);
    }
}

contract AccessManagerEnumerableMock is AccessManagerMock, AccessManagerEnumerable {
    constructor(address initialAdmin) AccessManagerMock(initialAdmin) {}

    function _grantRole(
        uint64 roleId,
        address account,
        uint32 grantDelay,
        uint32 executionDelay
    ) internal override(AccessManager, AccessManagerEnumerable) returns (bool) {
        return super._grantRole(roleId, account, grantDelay, executionDelay);
    }

    function _revokeRole(
        uint64 roleId,
        address account
    ) internal override(AccessManager, AccessManagerEnumerable) returns (bool) {
        return super._revokeRole(roleId, account);
    }

    function _setTargetFunctionRole(
        address target,
        bytes4 selector,
        uint64 roleId
    ) internal override(AccessManager, AccessManagerEnumerable) {
        super._setTargetFunctionRole(target, selector, roleId);
    }
}
