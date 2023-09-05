// SPDX-License-Identifier: MIT

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

    event GroupLabel(uint64 indexed groupId, string label);
    event GroupGranted(uint64 indexed groupId, address indexed account, uint32 delay, uint48 since, bool newMember);
    event GroupRevoked(uint64 indexed groupId, address indexed account);
    event GroupAdminChanged(uint64 indexed groupId, uint64 indexed admin);
    event GroupGuardianChanged(uint64 indexed groupId, uint64 indexed guardian);
    event GroupGrantDelayChanged(uint64 indexed groupId, uint32 delay, uint48 since);

    event TargetClosed(address indexed target, bool closed);
    event TargetFunctionGroupUpdated(address indexed target, bytes4 selector, uint64 indexed groupId);
    event TargetAdminDelayUpdated(address indexed target, uint32 delay, uint48 since);

    error AccessManagerAlreadyScheduled(bytes32 operationId);
    error AccessManagerNotScheduled(bytes32 operationId);
    error AccessManagerNotReady(bytes32 operationId);
    error AccessManagerExpired(bytes32 operationId);
    error AccessManagerLockedAccount(address account);
    error AccessManagerLockedGroup(uint64 groupId);
    error AccessManagerBadConfirmation();
    error AccessManagerUnauthorizedAccount(address msgsender, uint64 groupId);
    error AccessManagerUnauthorizedCall(address caller, address target, bytes4 selector);
    error AccessManagerCannotCancel(address msgsender, address caller, address target, bytes4 selector);

    function canCall(
        address caller,
        address target,
        bytes4 selector
    ) external view returns (bool allowed, uint32 delay);

    function expiration() external view returns (uint32);

    function isTargetClosed(address target) external view returns (bool);

    function getTargetFunctionGroup(address target, bytes4 selector) external view returns (uint64);

    function getTargetAdminDelay(address target) external view returns (uint32);

    function getGroupAdmin(uint64 groupId) external view returns (uint64);

    function getGroupGuardian(uint64 groupId) external view returns (uint64);

    function getGroupGrantDelay(uint64 groupId) external view returns (uint32);

    function getAccess(uint64 groupId, address account) external view returns (uint48, uint32, uint32, uint48);

    function hasGroup(uint64 groupId, address account) external view returns (bool, uint32);

    function labelGroup(uint64 groupId, string calldata label) external;

    function grantGroup(uint64 groupId, address account, uint32 executionDelay) external;

    function revokeGroup(uint64 groupId, address account) external;

    function renounceGroup(uint64 groupId, address callerConfirmation) external;

    function setGroupAdmin(uint64 groupId, uint64 admin) external;

    function setGroupGuardian(uint64 groupId, uint64 guardian) external;

    function setGrantDelay(uint64 groupId, uint32 newDelay) external;

    function setTargetFunctionGroup(address target, bytes4[] calldata selectors, uint64 groupId) external;

    function setTargetAdminDelay(address target, uint32 newDelay) external;

    function setTargetClosed(address target, bool closed) external;

    function getSchedule(bytes32 id) external view returns (uint48);

    function getNonce(bytes32 id) external view returns (uint32);

    function schedule(address target, bytes calldata data, uint48 when) external returns (bytes32, uint32);

    function relay(address target, bytes calldata data) external payable returns (uint32);

    function cancel(address caller, address target, bytes calldata data) external returns (uint32);

    function consumeScheduledOp(address caller, bytes calldata data) external;

    function updateAuthority(address target, address newAuthority) external;
}
