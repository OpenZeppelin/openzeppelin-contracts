// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {IAccessManaged} from "./IAccessManaged.sol";
import {Time} from "../../utils/types/Time.sol";

interface IAccessManager {
    enum AccessMode {
        Custom,
        Closed,
        Open
    }

    // Structure that stores the details for a group/account pair. This structures fit into a single slot.
    struct Access {
        // Timepoint at which the user gets the permission. If this is either 0, or in the future, the group permission
        // are not available. Should be checked using {Time-isSetAndPast}
        uint48 since;
        // delay for execution. Only applies to restricted() / relay() calls. This does not restrict access to
        // functions that use the `onlyGroup` modifier.
        Time.Delay delay;
    }

    // Structure that stores the details of a group, including:
    // - the members of the group
    // - the admin group (that can grant or revoke permissions)
    // - the guardian group (that can cancel operations targeting functions that need this group
    // - the grand delay
    struct Group {
        mapping(address user => Access access) members;
        uint64 admin;
        uint64 guardian;
        Time.Delay delay; // delay for granting
    }

    /**
     * @dev A delay operation was schedule.
     */
    event Scheduled(bytes32 operationId, address caller, address target, bytes data);

    /**
     * @dev A scheduled operation was executed.
     */
    event Executed(bytes32 operationId);

    /**
     * @dev A scheduled operation was canceled.
     */
    event Canceled(bytes32 operationId);

    event GroupLabel(uint64 indexed groupId, string label);
    event GroupGranted(uint64 indexed groupId, address indexed account, uint48 since, uint32 delay);
    event GroupRevoked(uint64 indexed groupId, address indexed account);
    event GroupExecutionDelayUpdated(uint64 indexed groupId, address indexed account, uint32 delay, uint48 from);
    event GroupAdminChanged(uint64 indexed groupId, uint64 indexed admin);
    event GroupGuardianChanged(uint64 indexed groupId, uint64 indexed guardian);
    event GroupGrantDelayChanged(uint64 indexed groupId, uint32 delay, uint48 from);
    event AccessModeUpdated(address indexed target, AccessMode mode);
    event FunctionAllowedGroupUpdated(address indexed target, bytes4 selector, uint64 indexed groupId);
    event AdminDelayUpdated(bytes4 selector, uint32 delay, uint48 from);

    error AccessManagerAlreadyScheduled(bytes32 operationId);
    error AccessManagerNotScheduled(bytes32 operationId);
    error AccessManagerNotReady(bytes32 operationId);
    error AccessManagerExpired(bytes32 operationId);
    error AccessManagerLockedGroup(uint64 groupId);
    error AccessManagerAcountAlreadyInGroup(uint64 groupId, address account);
    error AccessManagerAcountNotInGroup(uint64 groupId, address account);
    error AccessManagerBadConfirmation();
    error AccessControlUnauthorizedAccount(address msgsender, uint64 groupId);
    error AccessManagerUnauthorizedCall(address caller, address target, bytes4 selector);
    error AccessManagerCannotCancel(address msgsender, address caller, address target, bytes4 selector);

    function canCall(
        address caller,
        address target,
        bytes4 selector
    ) external view returns (bool allowed, uint32 delay);

    function getContractMode(address target) external view returns (AccessMode);

    function getFunctionAllowedGroup(address target, bytes4 selector) external view returns (uint64);

    function getGroupAdmin(uint64 groupId) external view returns (uint64);

    function getGroupGuardian(uint64 groupId) external view returns (uint64);

    function getGroupGrantDelay(uint64 groupId) external view returns (uint32);

    function getAccess(uint64 groupId, address account) external view returns (uint48, uint32, uint32, uint48);

    function hasGroup(uint64 groupId, address account) external view returns (bool, uint32);

    function grantGroup(uint64 groupId, address account, uint32 executionDelay) external;

    function revokeGroup(uint64 groupId, address account) external;

    function renounceGroup(uint64 groupId, address callerConfirmation) external;

    function setExecuteDelay(uint64 groupId, address account, uint32 newDelay) external;

    function setGroupAdmin(uint64 groupId, uint64 admin) external;

    function setGroupGuardian(uint64 groupId, uint64 guardian) external;

    function setGrantDelay(uint64 groupId, uint32 newDelay) external;

    function setContractModeCustom(address target) external;

    function setContractModeOpen(address target) external;

    function setContractModeClosed(address target) external;

    function schedule(address target, bytes calldata data, uint48 when) external returns (bytes32);

    function cancel(address caller, address target, bytes calldata data) external;

    function relay(address target, bytes calldata data) external payable;

    function consumeScheduledOp(address caller, bytes calldata data) external;

    function updateAuthority(IAccessManaged target, address newAuthority) external;
}
