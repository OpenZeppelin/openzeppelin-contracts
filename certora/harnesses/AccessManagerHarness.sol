// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import "../patched/access/manager/AccessManager.sol";

contract AccessManagerHarness is AccessManager {
    constructor(address initialAdmin) AccessManager(initialAdmin) {}

    // bug introduction: inverse check-effect
    /*
    function bugged_execute(address target, bytes calldata data) public payable virtual returns (uint32) {
        // Mark the target and selector as authorised
        // Note: here we know that data is at least 4 bytes long, because otherwize `_canCallExtended` would have
        // returned (false, 0) and that would have cause the `AccessManagerUnauthorizedCall` error to be triggered.
        bytes32 executionIdBefore = _executionId;
        _executionId = _hashExecutionId(target, bytes4(data));

        // Perform call
        Address.functionCallWithValue(target, data, msg.value);

        // Reset execute identifier
        _executionId = executionIdBefore;

        address caller = _msgSender();

        // Fetch restrictions that apply to the caller on the targeted function
        (bool immediate, uint32 setback) = _canCallExtended(caller, target, data);

        // If call is not authorized, revert
        // Note: this will also be triggered if data.length < 4. In that case the selector param in the custom error
        // will be padded to 4 bytes with zeros.
        if (!immediate && setback == 0) {
            revert AccessManagerUnauthorizedCall(caller, target, bytes4(data));
        }

        // If caller is authorised, check operation was scheduled early enough
        bytes32 operationId = hashOperation(caller, target, data);
        uint32 nonce;

        if (setback != 0) {
            nonce = _consumeScheduledOp(operationId);
        }

        return nonce;
    }
    */

    // FV
    function canCall_1(address caller, address target, bytes4 selector) external view returns (bool result) {
        (result,) = canCall(caller, target, selector);
    }

    function canCall_2(address caller, address target, bytes4 selector) external view returns (uint32 result) {
        (,result) = canCall(caller, target, selector);
    }

    function canCallExtended(address caller, address target, bytes calldata data) external view returns (bool, uint32) {
        return _canCallExtended(caller, target, data);
    }

    function canCallExtended_1(address caller, address target, bytes calldata data) external view returns (bool result) {
        (result,) = _canCallExtended(caller, target, data);
    }

    function canCallExtended_2(address caller, address target, bytes calldata data) external view returns (uint32 result) {
        (,result) = _canCallExtended(caller, target, data);
    }

    function getAdminRestrictions_1(bytes calldata data) external view returns (bool result) {
        (result,,) = _getAdminRestrictions(data);
    }

    function getAdminRestrictions_2(bytes calldata data) external view returns (uint64 result) {
        (,result,) = _getAdminRestrictions(data);
    }

    function getAdminRestrictions_3(bytes calldata data) external view returns (uint32 result) {
        (,,result) = _getAdminRestrictions(data);
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
}
