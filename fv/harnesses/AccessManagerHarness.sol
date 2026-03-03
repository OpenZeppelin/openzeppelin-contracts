// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import "../patched/access/manager/AccessManager.sol";

contract AccessManagerHarness is AccessManager {
    // override with a storage slot that can basically take any value.
    uint32 private _minSetback;

    constructor(address initialAdmin) AccessManager(initialAdmin) {}

    // FV
    function minSetback() public view override returns (uint32) {
        return _minSetback;
    }

    function canCall_immediate(address caller, address target, bytes4 selector) external view returns (bool result) {
        (result,) = canCall(caller, target, selector);
    }

    function canCall_delay(address caller, address target, bytes4 selector) external view returns (uint32 result) {
        (,result) = canCall(caller, target, selector);
    }

    function canCallExtended(address caller, address target, bytes calldata data) external view returns (bool, uint32) {
        return _canCallExtended(caller, target, data);
    }

    function canCallExtended_immediate(address caller, address target, bytes calldata data) external view returns (bool result) {
        (result,) = _canCallExtended(caller, target, data);
    }

    function canCallExtended_delay(address caller, address target, bytes calldata data) external view returns (uint32 result) {
        (,result) = _canCallExtended(caller, target, data);
    }

    function getAdminRestrictions_restricted(bytes calldata data) external view returns (bool result) {
        (result,,) = _getAdminRestrictions(data);
    }

    function getAdminRestrictions_roleAdminId(bytes calldata data) external view returns (uint64 result) {
        (,result,) = _getAdminRestrictions(data);
    }

    function getAdminRestrictions_executionDelay(bytes calldata data) external view returns (uint32 result) {
        (,,result) = _getAdminRestrictions(data);
    }

    function hasRole_isMember(uint64 roleId, address account) external view returns (bool result) {
        (result,) = hasRole(roleId, account);
    }

    function hasRole_executionDelay(uint64 roleId, address account) external view returns (uint32 result) {
        (,result) = hasRole(roleId, account);
    }

    function getAccess_since(uint64 roleId, address account) external view returns (uint48 result) {
        (result,,,) = getAccess(roleId, account);
    }

    function getAccess_currentDelay(uint64 roleId, address account) external view returns (uint32 result) {
        (,result,,) = getAccess(roleId, account);
    }

    function getAccess_pendingDelay(uint64 roleId, address account) external view returns (uint32 result) {
        (,,result,) = getAccess(roleId, account);
    }

    function getAccess_effect(uint64 roleId, address account) external view returns (uint48 result) {
        (,,,result) = getAccess(roleId, account);
    }

    function getTargetAdminDelay_after(address target) public view virtual returns (uint32 result) {
        (,result,) = _getTargetAdminDelayFull(target);
    }

    function getTargetAdminDelay_effect(address target) public view virtual returns (uint48 result) {
        (,,result) = _getTargetAdminDelayFull(target);
    }

    function getRoleGrantDelay_after(uint64 roleId) public view virtual returns (uint32 result) {
        (,result,) = _getRoleGrantDelayFull(roleId);
    }

    function getRoleGrantDelay_effect(uint64 roleId) public view virtual returns (uint48 result) {
        (,,result) = _getRoleGrantDelayFull(roleId);
    }

    function hashExecutionId(address target, bytes4 selector) external pure returns (bytes32) {
        return _hashExecutionId(target, selector);
    }

    function executionId() external view returns (bytes32) {
        return _executionId;
    }

    // Pad with zeros (and don't revert) if data is too short.
    function getSelector(bytes calldata data) external pure returns (bytes4) {
        return bytes4(data);
    }

    function getFirstArgumentAsAddress(bytes calldata data) external pure returns (address) {
        return abi.decode(data[0x04:0x24], (address));
    }

    function getFirstArgumentAsUint64(bytes calldata data) external pure returns (uint64) {
        return abi.decode(data[0x04:0x24], (uint64));
    }

    function _checkAuthorized() internal override {
        // We need this hack otherwise certora will assume _checkSelector(_msgData()) can return anything :/
        require(msg.sig == _checkSelector(_msgData()));
        super._checkAuthorized();
    }
}
