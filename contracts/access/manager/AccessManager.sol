// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {IAccessManager} from "./IAccessManager.sol";
import {IAccessManaged} from "./IAccessManaged.sol";
import {Address} from "../../utils/Address.sol";
import {Context} from "../../utils/Context.sol";
import {Multicall} from "../../utils/Multicall.sol";
import {Time} from "../../utils/types/Time.sol";

/**
 * @dev AccessManager is a central contract to store the permissions of a system.
 *
 * The smart contracts under the control of an AccessManager instance will have a set of "restricted" functions, and the
 * exact details of how access is restricted for each of those functions is configurable by the admins of the instance.
 * These restrictions are expressed in terms of "groups".
 *
 * An AccessManager instance will define a set of groups. Accounts can be added into any number of these groups. Each of
 * them defines a role, and may confer access to some of the restricted functions in the system, as configured by admins
 * through the use of {setFunctionAllowedGroup}.
 *
 * Note that a function in a target contract may become permissioned in this way only when: 1) said contract is
 * {AccessManaged} and is connected to this contract as its manager, and 2) said function is decorated with the
 * `restricted` modifier.
 *
 * There is a special group defined by default named "public" which all accounts automatically have.
 *
 * Contracts where functions are mapped to groups are said to be in a "custom" mode, but contracts can also be
 * configured in two special modes: 1) the "open" mode, where all functions are allowed to the "public" group, and 2)
 * the "closed" mode, where no function is allowed to any group.
 *
 * Since all the permissions of the managed system can be modified by the admins of this instance, it is expected that
 * they will be highly secured (e.g., a multisig or a well-configured DAO).
 *
 * NOTE: This contract implements a form of the {IAuthority} interface, but {canCall} has additional return data so it
 * doesn't inherit `IAuthority`. It is however compatible with the `IAuthority` interface since the first 32 bytes of
 * the return data are a boolean as expected by that interface.
 *
 * NOTE: Systems that implement other access control mechanisms (for example using {Ownable}) can be paired with an
 * {AccessManager} by transferring permissions (ownership in the case of {Ownable}) directly to the {AccessManager}.
 * Users will be able to interact with these contracts through the {relay} function, following the access rules
 * registered in the {AccessManager}. Keep in mind that in that context, the msg.sender seen by restricted functions
 * will be {AccessManager} itself.
 *
 * WARNING: When granting permissions over an {Ownable} or {AccessControl} contract to an {AccessManager}, be very
 * mindful of the danger  associated with functions such as {{Ownable-renounceOwnership}} or
 * {{AccessControl-renounceRole}}.
 */
contract AccessManager is Context, Multicall, IAccessManager {
    using Time for *;

    struct AccessMode {
        uint64 familyId;
        bool closed;
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

    struct Family {
        mapping(bytes4 selector => uint64 groupId) allowedGroups;
        Time.Delay adminDelay;
    }

    uint64 public constant ADMIN_GROUP = type(uint64).min; // 0
    uint64 public constant PUBLIC_GROUP = type(uint64).max; // 2**64-1

    mapping(address target => AccessMode mode) private _contractMode;
    mapping(uint64 familyId => Family) private _families;
    mapping(uint64 groupId => Group) private _groups;
    mapping(bytes32 operationId => uint48 schedule) private _schedules;
    mapping(bytes4 selector => Time.Delay delay) private _adminDelays;

    // This should be transcient storage when supported by the EVM.
    bytes32 private _relayIdentifier;

    /**
     * @dev Check that the caller has a given permission level (`groupId`). Note that this does NOT consider execution
     * delays that may be associated to that group.
     */
    modifier onlyGroup(uint64 groupId) {
        _checkGroup(groupId);
        _;
    }

    /**
     * @dev Check that the caller is an admin and that the top-level function currently executing has been scheduled
     * sufficiently ahead of time, if necessary according to admin delays.
     */
    modifier withFamilyDelay(uint64 familyId) {
        _checkFamilyDelay(familyId);
        _;
    }

    constructor(address initialAdmin) {
        // admin is active immediately and without any execution delay.
        _grantGroup(ADMIN_GROUP, initialAdmin, 0, 0);
    }

    // =================================================== GETTERS ====================================================
    /**
     * @dev Check if an address (`caller`) is authorised to call a given function on a given contract directly (with
     * no restriction). Additionally, it returns the delay needed to perform the call indirectly through the {schedule}
     * & {relay} workflow.
     *
     * This function is usually called by the targeted contract to control immediate execution of restricted functions.
     * Therefore we only return true is the call can be performed without any delay. If the call is subject to a delay,
     * then the function should return false, and the caller should schedule the operation for future execution.
     *
     * We may be able to hash the operation, and check if the call was scheduled, but we would not be able to cleanup
     * the schedule, leaving the possibility of multiple executions. Maybe this function should not be view?
     *
     * NOTE: The IAuthority interface does not include the `uint32` delay. This is an extension of that interface that
     * is backward compatible. Some contract may thus ignore the second return argument. In that case they will fail
     * to identify the indirect workflow, and will consider call that require a delay to be forbidden.
     */
    function canCall(address caller, address target, bytes4 selector) public view virtual returns (bool, uint32) {
        (uint64 familyId, bool closed) = getContractFamily(target);
        if (closed) {
            return (false, 0);
        } else if (caller == address(this)) {
            // Caller is AccessManager => call was relayed. In that case the relay already checked permissions. We
            // verify that the call "identifier", which is set during the relay call, is correct.
            return (_relayIdentifier == _hashRelayIdentifier(target, selector), 0);
        } else {
            uint64 groupId = getFamilyFunctionGroup(familyId, selector);
            (bool inGroup, uint32 currentDelay) = hasGroup(groupId, caller);
            return (inGroup && currentDelay == 0, currentDelay);
        }
    }

    /**
     * @dev Expiration delay for scheduled proposals. Defaults to 1 week.
     */
    function expiration() public view virtual returns (uint32) {
        return 1 weeks;
    }

    /**
     * @dev Minimum setback for delay updates. Defaults to 1 day.
     */
    function minSetback() public view virtual returns (uint32) {
        return 0; // TODO: set to 1 day
    }

    /**
     * @dev Get the mode under which a contract is operating.
     */
    function getContractFamily(address target) public view virtual returns (uint64, bool) {
        AccessMode storage mode = _contractMode[target];
        return (mode.familyId, mode.closed);
    }

    /**
     * @dev Get the permission level (group) required to call a function. This only applies for contract that are
     * operating under the `Custom` mode.
     */
    function getFamilyFunctionGroup(uint64 familyId, bytes4 selector) public view virtual returns (uint64) {
        return _families[familyId].allowedGroups[selector];
    }

    function getFamilyAdminDelay(uint64 familyId) public view virtual returns (uint32) {
        return _families[familyId].adminDelay.get();
    }

    /**
     * @dev Get the id of the group that acts as an admin for given group.
     *
     * The admin permission is required to grant the group, revoke the group and update the execution delay to execute
     * an operation that is restricted to this group.
     */
    function getGroupAdmin(uint64 groupId) public view virtual returns (uint64) {
        return _groups[groupId].admin;
    }

    /**
     * @dev Get the group that acts as a guardian for a given group.
     *
     * The guardian permission allows canceling operations that have been scheduled under the group.
     */
    function getGroupGuardian(uint64 groupId) public view virtual returns (uint64) {
        return _groups[groupId].guardian;
    }

    /**
     * @dev Get the group current grant delay, that value may change at any point, without an event emitted, following
     * a call to {setGrantDelay}. Changes to this value, including effect timepoint are notified by the
     * {GroupGrantDelayChanged} event.
     */
    function getGroupGrantDelay(uint64 groupId) public view virtual returns (uint32) {
        return _groups[groupId].delay.get();
    }

    /**
     * @dev Get the access details for a given account in a given group. These details include the timepoint at which
     * membership becomes active, and the delay applied to all operation by this user that require this permission
     * level.
     *
     * Returns:
     * [0] Timestamp at which the account membership becomes valid. 0 means role is not granted.
     * [1] Current execution delay for the account.
     * [2] Pending execution delay for the account.
     * [3] Timestamp at which the pending execution delay will become active. 0 means no delay update is scheduled.
     */
    function getAccess(uint64 groupId, address account) public view virtual returns (uint48, uint32, uint32, uint48) {
        Access storage access = _groups[groupId].members[account];

        uint48 since = access.since;
        (uint32 currentDelay, uint32 pendingDelay, uint48 effect) = access.delay.getFull();

        return (since, currentDelay, pendingDelay, effect);
    }

    /**
     * @dev Check if a given account currently had the permission level corresponding to a given group. Note that this
     * permission might be associated with a delay. {getAccess} can provide more details.
     */
    function hasGroup(uint64 groupId, address account) public view virtual returns (bool, uint32) {
        if (groupId == PUBLIC_GROUP) {
            return (true, 0);
        } else {
            (uint48 inGroupSince, uint32 currentDelay, , ) = getAccess(groupId, account);
            return (inGroupSince.isSetAndPast(Time.timestamp()), currentDelay);
        }
    }

    // =============================================== GROUP MANAGEMENT ===============================================
    /**
     * @dev Give a label to a group, for improved group discoverabily by UIs.
     *
     * Emits a {GroupLabel} event.
     */
    function labelGroup(uint64 groupId, string calldata label) public virtual onlyGroup(ADMIN_GROUP) {
        if (groupId == ADMIN_GROUP || groupId == PUBLIC_GROUP) {
            revert AccessManagerLockedGroup(groupId);
        }
        emit GroupLabel(groupId, label);
    }

    /**
     * @dev Add `account` to `groupId`. This gives him the authorization to call any function that is restricted to
     * this group. An optional execution delay (in seconds) can be set. If that delay is non 0, the user is required
     * to schedule any operation that is restricted to members this group. The user will only be able to execute the
     * operation after the delay expires. During this delay, admin and guardians can cancel the operation (see
     * {cancel}).
     *
     * Requirements:
     *
     * - the caller must be in the group's admins
     *
     * Emits a {GroupGranted} event
     */
    function grantGroup(
        uint64 groupId,
        address account,
        uint32 executionDelay
    ) public virtual onlyGroup(getGroupAdmin(groupId)) {
        _grantGroup(groupId, account, getGroupGrantDelay(groupId), executionDelay);
    }

    /**
     * @dev Remove an account for a group, with immediate effect.
     *
     * Requirements:
     *
     * - the caller must be in the group's admins
     *
     * Emits a {GroupRevoked} event
     */
    function revokeGroup(uint64 groupId, address account) public virtual onlyGroup(getGroupAdmin(groupId)) {
        _revokeGroup(groupId, account);
    }

    /**
     * @dev Renounce group permissions for the calling account, with immediate effect.
     *
     * Requirements:
     *
     * - the caller must be `callerConfirmation`.
     *
     * Emits a {GroupRevoked} event
     */
    function renounceGroup(uint64 groupId, address callerConfirmation) public virtual {
        if (callerConfirmation != _msgSender()) {
            revert AccessManagerBadConfirmation();
        }
        _revokeGroup(groupId, callerConfirmation);
    }

    /**
     * @dev Set the execution delay for a given account in a given group. This update is not immediate and follows the
     * delay rules. For example, If a user currently has a delay of 3 hours, and this is called to reduce that delay to
     * 1 hour, the new delay will take some time to take effect, enforcing that any operation executed in the 3 hours
     * that follows this update was indeed scheduled before this update.
     *
     * Requirements:
     *
     * - the caller must be in the group's admins
     *
     * Emits a {GroupExecutionDelayUpdated} event
     */
    function setExecuteDelay(
        uint64 groupId,
        address account,
        uint32 newDelay
    ) public virtual onlyGroup(getGroupAdmin(groupId)) {
        _setExecuteDelay(groupId, account, newDelay);
    }

    /**
     * @dev Change admin group for a given group.
     *
     * Requirements:
     *
     * - the caller must be a global admin
     *
     * Emits a {GroupAdminChanged} event
     */
    function setGroupAdmin(uint64 groupId, uint64 admin) public virtual onlyGroup(ADMIN_GROUP) {
        _setGroupAdmin(groupId, admin);
    }

    /**
     * @dev Change guardian group for a given group.
     *
     * Requirements:
     *
     * - the caller must be a global admin
     *
     * Emits a {GroupGuardianChanged} event
     */
    function setGroupGuardian(uint64 groupId, uint64 guardian) public virtual onlyGroup(ADMIN_GROUP) {
        _setGroupGuardian(groupId, guardian);
    }

    /**
     * @dev Update the delay for granting a `groupId`.
     *
     * Requirements:
     *
     * - the caller must be a global admin
     *
     * Emits a {GroupGrantDelayChanged} event
     */
    function setGrantDelay(uint64 groupId, uint32 newDelay) public virtual onlyGroup(ADMIN_GROUP) {
        _setGrantDelay(groupId, newDelay);
    }

    /**
     * @dev Internal version of {grantGroup} without access control.
     *
     * Emits a {GroupGranted} event
     */
    function _grantGroup(uint64 groupId, address account, uint32 grantDelay, uint32 executionDelay) internal virtual {
        if (groupId == PUBLIC_GROUP) {
            revert AccessManagerLockedGroup(groupId);
        } else if (_groups[groupId].members[account].since != 0) {
            revert AccessManagerAccountAlreadyInGroup(groupId, account);
        }

        uint48 since = Time.timestamp() + grantDelay;
        _groups[groupId].members[account] = Access({since: since, delay: executionDelay.toDelay()});

        emit GroupGranted(groupId, account, since, executionDelay);
    }

    /**
     * @dev Internal version of {revokeGroup} without access control. This logic is also used by {renounceGroup}.
     *
     * Emits a {GroupRevoked} event
     */
    function _revokeGroup(uint64 groupId, address account) internal virtual {
        if (groupId == PUBLIC_GROUP) {
            revert AccessManagerLockedGroup(groupId);
        } else if (_groups[groupId].members[account].since == 0) {
            revert AccessManagerAccountNotInGroup(groupId, account);
        }

        delete _groups[groupId].members[account];

        emit GroupRevoked(groupId, account);
    }

    /**
     * @dev Internal version of {setExecuteDelay} without access control.
     *
     * Emits a {GroupExecutionDelayUpdated} event.
     */
    function _setExecuteDelay(uint64 groupId, address account, uint32 newDuration) internal virtual {
        if (groupId == PUBLIC_GROUP || groupId == ADMIN_GROUP) {
            revert AccessManagerLockedGroup(groupId);
        } else if (_groups[groupId].members[account].since == 0) {
            revert AccessManagerAccountNotInGroup(groupId, account);
        }

        Time.Delay updated = _groups[groupId].members[account].delay.withUpdate(newDuration, minSetback());
        _groups[groupId].members[account].delay = updated;

        (, , uint48 effect) = updated.unpack();
        emit GroupExecutionDelayUpdated(groupId, account, newDuration, effect);
    }

    /**
     * @dev Internal version of {setGroupAdmin} without access control.
     *
     * Emits a {GroupAdminChanged} event
     */
    function _setGroupAdmin(uint64 groupId, uint64 admin) internal virtual {
        if (groupId == ADMIN_GROUP || groupId == PUBLIC_GROUP) {
            revert AccessManagerLockedGroup(groupId);
        }

        _groups[groupId].admin = admin;

        emit GroupAdminChanged(groupId, admin);
    }

    /**
     * @dev Internal version of {setGroupGuardian} without access control.
     *
     * Emits a {GroupGuardianChanged} event
     */
    function _setGroupGuardian(uint64 groupId, uint64 guardian) internal virtual {
        if (groupId == ADMIN_GROUP || groupId == PUBLIC_GROUP) {
            revert AccessManagerLockedGroup(groupId);
        }

        _groups[groupId].guardian = guardian;

        emit GroupGuardianChanged(groupId, guardian);
    }

    /**
     * @dev Internal version of {setGrantDelay} without access control.
     *
     * Emits a {GroupGrantDelayChanged} event
     */
    function _setGrantDelay(uint64 groupId, uint32 newDelay) internal virtual {
        if (groupId == PUBLIC_GROUP) {
            revert AccessManagerLockedGroup(groupId);
        }

        Time.Delay updated = _groups[groupId].delay.withUpdate(newDelay, minSetback());
        _groups[groupId].delay = updated;

        (, , uint48 effect) = updated.unpack();
        emit GroupGrantDelayChanged(groupId, newDelay, effect);
    }

    // ============================================= FUNCTION MANAGEMENT ==============================================
    /**
     * @dev Set the level of permission (`group`) required to call functions identified by the `selectors` in the
     * `target` contract.
     *
     * Requirements:
     *
     * - the caller must be a global admin
     *
     * Emits a {FunctionAllowedGroupUpdated} event per selector
     */
    function setFamilyFunctionGroup(
        uint64 familyId,
        bytes4[] calldata selectors,
        uint64 groupId
    ) public virtual onlyGroup(ADMIN_GROUP) withFamilyDelay(familyId) {
        for (uint256 i = 0; i < selectors.length; ++i) {
            _setFamilyFunctionGroup(familyId, selectors[i], groupId);
        }
    }

    /**
     * @dev Internal version of {setFunctionAllowedGroup} without access control.
     *
     * Emits a {FunctionAllowedGroupUpdated} event
     */
    function _setFamilyFunctionGroup(uint64 familyId, bytes4 selector, uint64 groupId) internal virtual {
        _checkValidFamilyId(familyId);
        _families[familyId].allowedGroups[selector] = groupId;
        emit FamilyFunctionGroupUpdated(familyId, selector, groupId);
    }

    /**
     * @dev Set the delay for management operations on a given family of contract.
     *
     * Requirements:
     *
     * - the caller must be a global admin
     *
     * Emits a {FunctionAllowedGroupUpdated} event per selector
     */
    function setFamilyAdminDelay(uint64 familyId, uint32 newDelay) public virtual onlyGroup(ADMIN_GROUP) {
        _setFamilyAdminDelay(familyId, newDelay);
    }

    /**
     * @dev Internal version of {setFamilyAdminDelay} without access control.
     *
     * Emits a {FamilyAdminDelayUpdated} event
     */
    function _setFamilyAdminDelay(uint64 familyId, uint32 newDelay) internal virtual {
        _checkValidFamilyId(familyId);
        Time.Delay updated = _families[familyId].adminDelay.withUpdate(newDelay, minSetback());
        _families[familyId].adminDelay = updated;
        (, , uint48 effect) = updated.unpack();
        emit FamilyAdminDelayUpdated(familyId, newDelay, effect);
    }

    /**
     * @dev Reverts if `familyId` is 0.
     */
    function _checkValidFamilyId(uint64 familyId) private pure {
        if (familyId == 0) {
            revert AccessManagerInvalidFamily(familyId);
        }
    }

    // =============================================== MODE MANAGEMENT ================================================
    /**
     * @dev Set the family of a contract.
     *
     * Requirements:
     *
     * - the caller must be a global admin
     *
     * Emits a {ContractFamilyUpdated} event.
     */
    function setContractFamily(
        address target,
        uint64 familyId
    ) public virtual onlyGroup(ADMIN_GROUP) withFamilyDelay(_getContractFamilyId(target)) {
        _setContractFamily(target, familyId);
    }

    /**
     * @dev Set the family of a contract. This is an internal setter with no access restrictions.
     *
     * Emits a {ContractFamilyUpdated} event.
     */
    function _setContractFamily(address target, uint64 familyId) internal virtual {
        _contractMode[target].familyId = familyId;
        emit ContractFamilyUpdated(target, familyId);
    }

    /**
     * @dev Set the closed flag for a contract.
     *
     * Requirements:
     *
     * - the caller must be a global admin
     *
     * Emits a {ContractClosed} event.
     */
    function setContractClosed(address target, bool closed) public virtual onlyGroup(ADMIN_GROUP) {
        _setContractClosed(target, closed);
    }

    /**
     * @dev Set the closed flag for a contract. This is an internal setter with no access restrictions.
     *
     * Emits a {ContractClosed} event.
     */
    function _setContractClosed(address target, bool closed) internal virtual {
        _contractMode[target].closed = closed;
        emit ContractClosed(target, closed);
    }

    // ============================================== DELAYED OPERATIONS ==============================================
    /**
     * @dev Return the timepoint at which a scheduled operation will be ready for execution. This returns 0 if the
     * operation is not yet scheduled, has expired, was executed, or was canceled.
     */
    function getSchedule(bytes32 id) public view virtual returns (uint48) {
        uint48 timepoint = _schedules[id];
        return _isExpired(timepoint) ? 0 : timepoint;
    }

    /**
     * @dev Schedule a delayed operation for future execution, and return the operation identifier. It is possible to
     * choose the timestamp at which the operation becomes executable as long as it satisfies the execution delays
     * required for the caller. The special value zero will automatically set the earliest possible time.
     *
     * Emits a {OperationScheduled} event.
     */
    function schedule(address target, bytes calldata data, uint48 when) public virtual returns (bytes32) {
        address caller = _msgSender();

        // Fetch restriction to that apply to the caller on the targeted function
        (bool allowed, uint32 setback) = _canCallExtended(caller, target, data);

        uint48 minWhen = Time.timestamp() + setback;

        // If caller is not authorised, revert
        if (!allowed && (setback == 0 || when.isSetAndPast(minWhen - 1))) {
            revert AccessManagerUnauthorizedCall(caller, target, bytes4(data[0:4]));
        }

        // If caller is authorised, schedule operation
        bytes32 operationId = _hashOperation(caller, target, data);

        // Cannot reschedule unless the operation has expired
        uint48 prevTimepoint = _schedules[operationId];
        if (prevTimepoint != 0 && !_isExpired(prevTimepoint)) {
            revert AccessManagerAlreadyScheduled(operationId);
        }

        uint48 timepoint = when == 0 ? minWhen : when;
        _schedules[operationId] = timepoint;
        emit OperationScheduled(operationId, timepoint, caller, target, data);

        return operationId;
    }

    /**
     * @dev Execute a function that is delay restricted, provided it was properly scheduled beforehand, or the
     * execution delay is 0.
     *
     * Emits an {OperationExecuted} event only if the call was scheduled and delayed.
     */
    function relay(address target, bytes calldata data) public payable virtual {
        address caller = _msgSender();

        // Fetch restriction to that apply to the caller on the targeted function
        (bool allowed, uint32 setback) = _canCallExtended(caller, target, data);

        // If caller is not authorised, revert
        if (!allowed && setback == 0) {
            revert AccessManagerUnauthorizedCall(caller, target, bytes4(data));
        }

        // If caller is authorised, check operation was scheduled early enough
        bytes32 operationId = _hashOperation(caller, target, data);

        if (setback != 0) {
            _consumeScheduledOp(operationId);
        }

        // Mark the target and selector as authorised
        bytes32 relayIdentifierBefore = _relayIdentifier;
        _relayIdentifier = _hashRelayIdentifier(target, bytes4(data));

        // Perform call
        Address.functionCallWithValue(target, data, msg.value);

        // Reset relay identifier
        _relayIdentifier = relayIdentifierBefore;
    }

    /**
     * @dev Consume a scheduled operation targeting the caller. If such an operation exists, mark it as consumed
     * (emit an {OperationExecuted} event and clean the state). Otherwise, throw an error.
     *
     * This is useful for contract that want to enforce that calls targeting them were scheduled on the manager,
     * with all the verifications that it implies.
     *
     * Emit a {OperationExecuted} event
     */
    function consumeScheduledOp(address caller, bytes calldata data) public virtual {
        address target = _msgSender();
        require(IAccessManaged(target).isConsumingScheduledOp());
        _consumeScheduledOp(_hashOperation(caller, target, data));
    }

    /**
     * @dev Internal variant of {consumeScheduledOp} that operates on bytes32 operationId.
     */
    function _consumeScheduledOp(bytes32 operationId) internal virtual {
        uint48 timepoint = _schedules[operationId];

        if (timepoint == 0) {
            revert AccessManagerNotScheduled(operationId);
        } else if (timepoint > Time.timestamp()) {
            revert AccessManagerNotReady(operationId);
        } else if (_isExpired(timepoint)) {
            revert AccessManagerExpired(operationId);
        }

        delete _schedules[operationId];
        emit OperationExecuted(operationId, timepoint);
    }

    /**
     * @dev Cancel a scheduled (delayed) operation.
     *
     * Requirements:
     *
     * - the caller must be the proposer, or a guardian of the targeted function
     *
     * Emits a {OperationCanceled} event.
     */
    function cancel(address caller, address target, bytes calldata data) public virtual {
        address msgsender = _msgSender();
        bytes4 selector = bytes4(data[0:4]);

        bytes32 operationId = _hashOperation(caller, target, data);
        if (_schedules[operationId] == 0) {
            revert AccessManagerNotScheduled(operationId);
        } else if (caller != msgsender) {
            // calls can only be canceled by the account that scheduled them, a global admin, or by a guardian of the required group.
            (bool isAdmin, ) = hasGroup(ADMIN_GROUP, msgsender);
            (bool isGuardian, ) = hasGroup(
                getGroupGuardian(getFamilyFunctionGroup(_getContractFamilyId(target), selector)),
                msgsender
            );
            if (!isAdmin && !isGuardian) {
                revert AccessManagerCannotCancel(msgsender, caller, target, selector);
            }
        }

        uint48 timepoint = _schedules[operationId];
        delete _schedules[operationId];
        emit OperationCanceled(operationId, timepoint);
    }

    /**
     * @dev Hashing function for delayed operations
     */
    function _hashOperation(address caller, address target, bytes calldata data) private pure returns (bytes32) {
        return keccak256(abi.encode(caller, target, data));
    }

    /**
     * @dev Hashing function for relay protection
     */
    function _hashRelayIdentifier(address target, bytes4 selector) private pure returns (bytes32) {
        return keccak256(abi.encode(target, selector));
    }

    // ==================================================== OTHERS ====================================================
    /**
     * @dev Change the AccessManager instance used by a contract that correctly uses this instance.
     *
     * Requirements:
     *
     * - the caller must be a global admin
     */
    function updateAuthority(
        address target,
        address newAuthority
    ) public virtual onlyGroup(ADMIN_GROUP) withFamilyDelay(_getContractFamilyId(target)) {
        IAccessManaged(target).setAuthority(newAuthority);
    }

    // =================================================== HELPERS ====================================================
    function _checkGroup(uint64 groupId) internal view virtual {
        address account = _msgSender();
        (bool inGroup, ) = hasGroup(groupId, account);
        if (!inGroup) {
            revert AccessManagerUnauthorizedAccount(account, groupId);
        }
    }

    function _checkFamilyDelay(uint64 familyId) internal virtual {
        uint32 delay = getFamilyAdminDelay(familyId);
        if (delay > 0) {
            _consumeScheduledOp(_hashOperation(_msgSender(), address(this), _msgData()));
        }
    }

    function _getContractFamilyId(address target) private view returns (uint64 familyId) {
        (familyId, ) = getContractFamily(target);
    }

    function _parseFamilyOperation(bytes calldata data) private view returns (bool, uint64) {
        bytes4 selector = bytes4(data);
        if (selector == this.updateAuthority.selector || selector == this.setContractFamily.selector) {
            return (true, _getContractFamilyId(abi.decode(data[0x04:0x24], (address))));
        } else if (selector == this.setFamilyFunctionGroup.selector) {
            return (true, abi.decode(data[0x04:0x24], (uint64)));
        } else {
            return (false, 0);
        }
    }

    function _canCallExtended(address caller, address target, bytes calldata data) private view returns (bool, uint32) {
        if (target == address(this)) {
            (bool isFamilyOperation, uint64 familyId) = _parseFamilyOperation(data);
            uint32 delay = getFamilyAdminDelay(familyId);
            (bool inGroup, ) = hasGroup(ADMIN_GROUP, caller);
            return (inGroup && isFamilyOperation && delay == 0, delay);
        } else {
            bytes4 selector = bytes4(data);
            return canCall(caller, target, selector);
        }
    }

    function _isExpired(uint48 timepoint) private view returns (bool) {
        return timepoint + expiration() <= Time.timestamp();
    }
}
