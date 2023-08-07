// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {IAccessManaged} from "./IAccessManaged.sol";
import {Time} from "../../utils/types/Time.sol";

interface IAccessManager {
    /**
     * @dev A delayed operation was scheduled.
     */
    event OperationScheduled(bytes32 indexed operationId, uint48 schedule, address caller, address target, bytes data);

    /**
     * @dev A scheduled operation was executed.
     */
    event OperationExecuted(bytes32 indexed operationId, uint48 schedule);

    /**
     * @dev A scheduled operation was canceled.
     */
    event OperationCanceled(bytes32 indexed operationId, uint48 schedule);

    event GroupLabel(uint64 indexed groupId, string label);
    event GroupGranted(uint64 indexed groupId, address indexed account, uint48 since, uint32 delay);
    event GroupRevoked(uint64 indexed groupId, address indexed account);
    event GroupExecutionDelayUpdated(uint64 indexed groupId, address indexed account, uint32 delay, uint48 from);
    event GroupAdminChanged(uint64 indexed groupId, uint64 indexed admin);
    event GroupGuardianChanged(uint64 indexed groupId, uint64 indexed guardian);
    event GroupGrantDelayChanged(uint64 indexed groupId, uint32 delay, uint48 from);

    event ContractFamilyUpdated(address indexed target, uint64 indexed familyId);
    event ContractClosed(address indexed target, bool closed);

    event FamilyFunctionGroupUpdated(uint64 indexed familyId, bytes4 selector, uint64 indexed groupId);
    event FamilyAdminDelayUpdated(uint64 indexed familyId, uint32 delay, uint48 from);

    error AccessManagerAlreadyScheduled(bytes32 operationId);
    error AccessManagerNotScheduled(bytes32 operationId);
    error AccessManagerNotReady(bytes32 operationId);
    error AccessManagerExpired(bytes32 operationId);
    error AccessManagerLockedGroup(uint64 groupId);
    error AccessManagerInvalidFamily(uint64 familyId);
    error AccessManagerAccountAlreadyInGroup(uint64 groupId, address account);
    error AccessManagerAccountNotInGroup(uint64 groupId, address account);
    error AccessManagerBadConfirmation();
    error AccessManagerUnauthorizedAccount(address msgsender, uint64 groupId);
    error AccessManagerUnauthorizedCall(address caller, address target, bytes4 selector);
    error AccessManagerCannotCancel(address msgsender, address caller, address target, bytes4 selector);

    function canCall(
        address caller,
        address target,
        bytes4 selector
    ) external view returns (bool allowed, uint32 delay);

    function expiration() external returns (uint32);

    function getContractFamily(address target) external view returns (uint64 familyId, bool closed);

    function getFamilyFunctionGroup(uint64 familyId, bytes4 selector) external view returns (uint64);

    function getFamilyAdminDelay(uint64 familyId) external view returns (uint32);

    function getGroupAdmin(uint64 groupId) external view returns (uint64);

    function getGroupGuardian(uint64 groupId) external view returns (uint64);

    function getGroupGrantDelay(uint64 groupId) external view returns (uint32);

    function getAccess(uint64 groupId, address account) external view returns (uint48, uint32, uint32, uint48);

    function hasGroup(uint64 groupId, address account) external view returns (bool, uint32);

    function labelGroup(uint64 groupId, string calldata label) external;

    function grantGroup(uint64 groupId, address account, uint32 executionDelay) external;

    function revokeGroup(uint64 groupId, address account) external;

    function renounceGroup(uint64 groupId, address callerConfirmation) external;

    function setExecuteDelay(uint64 groupId, address account, uint32 newDelay) external;

    function setGroupAdmin(uint64 groupId, uint64 admin) external;

    function setGroupGuardian(uint64 groupId, uint64 guardian) external;

    function setGrantDelay(uint64 groupId, uint32 newDelay) external;

    function setFamilyFunctionGroup(uint64 familyId, bytes4[] calldata selectors, uint64 groupId) external;

    function setFamilyAdminDelay(uint64 familyId, uint32 newDelay) external;

    function setContractFamily(address target, uint64 familyId) external;

    function setContractClosed(address target, bool closed) external;

    function getSchedule(bytes32 id) external returns (uint48);

    function schedule(address target, bytes calldata data, uint48 when) external returns (bytes32);

    function relay(address target, bytes calldata data) external payable;

    function cancel(address caller, address target, bytes calldata data) external;

    function consumeScheduledOp(address caller, bytes calldata data) external;

    function updateAuthority(address target, address newAuthority) external;
}
