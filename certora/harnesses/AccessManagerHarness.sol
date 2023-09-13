// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import "../patched/access/manager/AccessManager.sol";

contract AccessManagerHarness is AccessManager {
    constructor(address initialAdmin) AccessManager(initialAdmin) {}

    // FV
    function canCall_1(address caller, address target, bytes4 selector) external view returns (bool result) {
        (result,) = canCall(caller, target, selector);
    }

    function canCall_2(address caller, address target, bytes4 selector) external view returns (uint32 result) {
        (, result) = canCall(caller, target, selector);
    }

    function hasRole_1(uint64 roleId, address account) external view returns (bool result) {
        (result,) = hasRole(roleId, account);
    }

    function hasRole_2(uint64 roleId, address account) external view returns (uint32 result) {
        (, result) = hasRole(roleId, account);
    }

    function getAccess_1(uint64 roleId, address account) external view returns (uint48 result) {
        (result,,,) = getAccess(roleId, account);
    }

    function getAccess_2(uint64 roleId, address account) external view returns (uint32 result) {
        (, result,,) = getAccess(roleId, account);
    }

    function getAccess_3(uint64 roleId, address account) external view returns (uint32 result) {
        (,, result,) = getAccess(roleId, account);
    }

    function getAccess_4(uint64 roleId, address account) external view returns (uint48 result) {
        (,,, result) = getAccess(roleId, account);
    }

    function hashExecutionId(address target, bytes4 selector) external pure returns (bytes32) {
        return _hashExecutionId(target, selector);
    }

    function executionId() external view returns (bytes32) {
        return _executionId;
    }
}
