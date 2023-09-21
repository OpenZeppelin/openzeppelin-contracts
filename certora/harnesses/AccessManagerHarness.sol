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
        (,result) = canCall(caller, target, selector);
    }

    function hasRole_1(uint64 roleId, address account) external view returns (bool result) {
        (result,) = hasRole(roleId, account);
    }

    function hasRole_2(uint64 roleId, address account) external view returns (uint32 result) {
        (,result) = hasRole(roleId, account);
    }

    function getAccess_1(uint64 roleId, address account) external view returns (uint48 result) {
        (result,,,) = getAccess(roleId, account);
    }

    function getAccess_2(uint64 roleId, address account) external view returns (uint32 result) {
        (,result,,) = getAccess(roleId, account);
    }

    function getAccess_3(uint64 roleId, address account) external view returns (uint32 result) {
        (,,result,) = getAccess(roleId, account);
    }

    function getAccess_4(uint64 roleId, address account) external view returns (uint48 result) {
        (,,,result) = getAccess(roleId, account);
    }

    function getTargetAdminDelay_2(address target) public view virtual returns (uint32 result) {
        (,result,) = _getTargetAdminDelayFull(target);
    }

    function getTargetAdminDelay_3(address target) public view virtual returns (uint48 result) {
        (,,result) = _getTargetAdminDelayFull(target);
    }

    function getRoleGrantDelay_2(uint64 roleId) public view virtual returns (uint32 result) {
        (,result,) = _getRoleGrantDelayFull(roleId);
    }

    function getRoleGrantDelay_3(uint64 roleId) public view virtual returns (uint48 result) {
        (,,result) = _getRoleGrantDelayFull(roleId);
    }

    function hashExecutionId(address target, bytes4 selector) external pure returns (bytes32) {
        return _hashExecutionId(target, selector);
    }

    function executionId() external view returns (bytes32) {
        return _executionId;
    }

    // function execute_labelRole(uint64 roleId, string calldata label) external {
    //     _callExecuteSelf(abi.encodeCall(this.labelRole, (roleId, label)));
    // }

    // function execute_grantRole(uint64 roleId ,address account, uint32 executionDelay) external {
    //     _callExecuteSelf(abi.encodeCall(this.grantRole, (roleId, account, executionDelay)));
    // }

    // function execute_revokeRole(uint64 roleId, address account) external {
    //     _callExecuteSelf(abi.encodeCall(this.revokeRole, (roleId, account)));
    // }

    // function execute_renounceRole(uint64 roleId, address callerConfirmation) external {
    //     _callExecuteSelf(abi.encodeCall(this.renounceRole, (roleId, callerConfirmation)));
    // }

    // function execute_setRoleAdmin(uint64 roleId, uint64 admin) external {
    //     _callExecuteSelf(abi.encodeCall(this.setRoleAdmin, (roleId, admin)));
    // }

    // function execute_setRoleGuardian(uint64 roleId, uint64 guardian) external {
    //     _callExecuteSelf(abi.encodeCall(this.setRoleGuardian, (roleId, guardian)));
    // }

    // function execute_setGrantDelay(uint64 roleId, uint32 newDelay) external {
    //     _callExecuteSelf(abi.encodeCall(this.setGrantDelay, (roleId, newDelay)));
    // }

    // function execute_setTargetFunctionRole(address target, bytes4[] calldata selectors, uint64 roleId) external {
    //     _callExecuteSelf(abi.encodeCall(this.setTargetFunctionRole, (target, selectors, roleId)));
    // }

    // function execute_setTargetAdminDelay(address target, uint32 newDelay) external {
    //     _callExecuteSelf(abi.encodeCall(this.setTargetAdminDelay, (target, newDelay)));
    // }

    // function execute_setTargetClosed(address target, bool closed) external {
    //     _callExecuteSelf(abi.encodeCall(this.setTargetClosed, (target, closed)));
    // }

    // function execute_schedule(address target, bytes calldata data, uint48 when) external {
    //     _callExecuteSelf(abi.encodeCall(this.schedule, (target, data, when)));
    // }

    // function execute_execute(address target, bytes calldata data) external {
    //     _callExecuteSelf(abi.encodeCall(this.execute, (target, data)));
    // }

    // function execute_cancel(address caller, address target, bytes calldata data) external {
    //     _callExecuteSelf(abi.encodeCall(this.cancel, (caller, target, data)));
    // }

    // function execute_consumeScheduledOp(address caller, bytes calldata data) external {
    //     _callExecuteSelf(abi.encodeCall(this.consumeScheduledOp, (caller, data)));
    // }

    // function execute_updateAuthority(address target, address newAuthority) external {
    //     _callExecuteSelf(abi.encodeCall(this.updateAuthority, (target, newAuthority)));
    // }

    // function _callExecuteSelf(bytes memory data) private {
    //     (bool success,) = address(this).delegatecall(abi.encodeCall(this.execute, (address(this), data)));
    //     require(success);
    // }
}
