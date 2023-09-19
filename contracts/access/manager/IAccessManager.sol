// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v5.0.0-rc.0) (access/manager/IAccessManager.sol)

pragma solidity ^0.8.20;

import {IAccessManaged} from "./IAccessManaged.sol";
import {Time} from "../../utils/types/Time.sol";

interface IAccessManager {
    /**
     * @dev A delayed operation was scheduled.
     */
    event OperationScheduled(
        bytes32 indexed operationId,
        uint32 indexed nonce,
        uint48 schedule,
        address caller,
        address target,
        bytes data
    );

    /**
     * @dev A scheduled operation was executed.
     */
    event OperationExecuted(bytes32 indexed operationId, uint32 indexed nonce);

    /**
     * @dev A scheduled operation was canceled.
     */
    event OperationCanceled(bytes32 indexed operationId, uint32 indexed nonce);

    event RoleLabel(uint64 indexed roleId, string label);
    event RoleGranted(uint64 indexed roleId, address indexed account, uint32 delay, uint48 since, bool newMember);
    event RoleRevoked(uint64 indexed roleId, address indexed account);
    event RoleAdminChanged(uint64 indexed roleId, uint64 indexed admin);
    event RoleGuardianChanged(uint64 indexed roleId, uint64 indexed guardian);
    event RoleGrantDelayChanged(uint64 indexed roleId, uint32 delay, uint48 since);
    event TargetClosed(address indexed target, bool closed);
    event TargetFunctionRoleUpdated(address indexed target, bytes4 selector, uint64 indexed roleId);
    event TargetAdminDelayUpdated(address indexed target, uint32 delay, uint48 since);

    error AccessManagerAlreadyScheduled(bytes32 operationId);
    error AccessManagerNotScheduled(bytes32 operationId);
    error AccessManagerNotReady(bytes32 operationId);
    error AccessManagerExpired(bytes32 operationId);
    error AccessManagerLockedAccount(address account);
    error AccessManagerLockedRole(uint64 roleId);
    error AccessManagerBadConfirmation();
    error AccessManagerUnauthorizedAccount(address msgsender, uint64 roleId);
    error AccessManagerUnauthorizedCall(address caller, address target, bytes4 selector);
    error AccessManagerUnauthorizedConsume(address target);
    error AccessManagerUnauthorizedCancel(address msgsender, address caller, address target, bytes4 selector);
    error AccessManagerInvalidInitialAdmin(address initialAdmin);

    function canCall(
        address caller,
        address target,
        bytes4 selector
    ) external view returns (bool allowed, uint32 delay);

    function hashOperation(address caller, address target, bytes calldata data) external view returns (bytes32);

    function expiration() external view returns (uint32);

    function isTargetClosed(address target) external view returns (bool);

    function getTargetFunctionRole(address target, bytes4 selector) external view returns (uint64);

    function getTargetAdminDelay(address target) external view returns (uint32);

    function getRoleAdmin(uint64 roleId) external view returns (uint64);

    function getRoleGuardian(uint64 roleId) external view returns (uint64);

    function getRoleGrantDelay(uint64 roleId) external view returns (uint32);

    function getAccess(uint64 roleId, address account) external view returns (uint48, uint32, uint32, uint48);

    function hasRole(uint64 roleId, address account) external view returns (bool, uint32);

    function labelRole(uint64 roleId, string calldata label) external;

    function grantRole(uint64 roleId, address account, uint32 executionDelay) external;

    function revokeRole(uint64 roleId, address account) external;

    function renounceRole(uint64 roleId, address callerConfirmation) external;

    function setRoleAdmin(uint64 roleId, uint64 admin) external;

    function setRoleGuardian(uint64 roleId, uint64 guardian) external;

    function setGrantDelay(uint64 roleId, uint32 newDelay) external;

    function setTargetFunctionRole(address target, bytes4[] calldata selectors, uint64 roleId) external;

    function setTargetAdminDelay(address target, uint32 newDelay) external;

    function setTargetClosed(address target, bool closed) external;

    function getSchedule(bytes32 id) external view returns (uint48);

    function getNonce(bytes32 id) external view returns (uint32);

    function schedule(address target, bytes calldata data, uint48 when) external returns (bytes32, uint32);

    function execute(address target, bytes calldata data) external payable returns (uint32);

    function cancel(address caller, address target, bytes calldata data) external returns (uint32);

    function consumeScheduledOp(address caller, bytes calldata data) external;

    function updateAuthority(address target, address newAuthority) external;
}
