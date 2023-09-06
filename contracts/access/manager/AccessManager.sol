// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {IAccessManager} from "./IAccessManager.sol";
import {IAccessManaged} from "./IAccessManaged.sol";
import {Address} from "../../utils/Address.sol";
import {Context} from "../../utils/Context.sol";
import {Multicall} from "../../utils/Multicall.sol";
import {Math} from "../../utils/math/Math.sol";
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
 * mindful of the danger associated with functions such as {{Ownable-renounceOwnership}} or
 * {{AccessControl-renounceRole}}.
 */
contract AccessManager is Context, Multicall, IAccessManager {
    using Time for *;

    struct TargetConfig {
        mapping(bytes4 selector => uint64 groupId) allowedGroups;
        Time.Delay adminDelay;
        bool closed;
    }

    // Structure that stores the details for a group/account pair. This structure fits into a single slot.
    struct Access {
        // Timepoint at which the user gets the permission. If this is either 0, or in the future, the group permission
        // is not available.
        uint48 since;
        // delay for execution. Only applies to restricted() / relay() calls. This does not restrict access to
        // functions that use the `onlyGroup` modifier.
        Time.Delay delay;
    }

    // Structure that stores the details of a group, including:
    // - the members of the group
    // - the admin group (that can grant or revoke permissions)
    // - the guardian group (that can cancel operations targeting functions that need this group
    // - the grant delay
    struct Group {
        mapping(address user => Access access) members;
        uint64 admin;
        uint64 guardian;
        Time.Delay grantDelay;
    }

    struct Schedule {
        uint48 timepoint;
        uint32 nonce;
    }

    uint64 public constant ADMIN_GROUP = type(uint64).min; // 0
    uint64 public constant PUBLIC_GROUP = type(uint64).max; // 2**64-1

    mapping(address target => TargetConfig mode) private _targets;
    mapping(uint64 groupId => Group) private _groups;
    mapping(bytes32 operationId => Schedule) private _schedules;

    // This should be transient storage when supported by the EVM.
    bytes32 private _relayIdentifier;

    /**
     * @dev Check that the caller is authorized to perform the operation, following the restrictions encoded in
     * {_getAdminRestrictions}.
     */
    modifier onlyAuthorized() {
        _checkAuthorized();
        _;
    }

    constructor(address initialAdmin) {
        if (initialAdmin == address(0)) {
            revert AccessManagerInvalidInitialAdmin(address(0));
        }

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
     * is backward compatible. Some contracts may thus ignore the second return argument. In that case they will fail
     * to identify the indirect workflow, and will consider calls that require a delay to be forbidden.
     */
    function canCall(address caller, address target, bytes4 selector) public view virtual returns (bool, uint32) {
        if (isTargetClosed(target)) {
            return (false, 0);
        } else if (caller == address(this)) {
            // Caller is AccessManager => call was relayed. In that case the relay already checked permissions. We
            // verify that the call "identifier", which is set during the relay call, is correct.
            return (_relayIdentifier == _hashRelayIdentifier(target, selector), 0);
        } else {
            uint64 groupId = getTargetFunctionGroup(target, selector);
            (bool inGroup, uint32 currentDelay) = hasGroup(groupId, caller);
            return inGroup ? (currentDelay == 0, currentDelay) : (false, 0);
        }
    }

    /**
     * @dev Expiration delay for scheduled proposals. Defaults to 1 week.
     */
    function expiration() public view virtual returns (uint32) {
        return 1 weeks;
    }

    /**
     * @dev Minimum setback for all delay updates, with the exception of execution delays, which
     * can be increased without setback (and in the event of an accidental increase can be reset
     * via {revokeGroup}). Defaults to 5 days.
     */
    function minSetback() public view virtual returns (uint32) {
        return 5 days;
    }

    /**
     * @dev Get the mode under which a contract is operating.
     */
    function isTargetClosed(address target) public view virtual returns (bool) {
        return _targets[target].closed;
    }

    /**
     * @dev Get the permission level (group) required to call a function. This only applies for contract that are
     * operating under the `Custom` mode.
     */
    function getTargetFunctionGroup(address target, bytes4 selector) public view virtual returns (uint64) {
        return _targets[target].allowedGroups[selector];
    }

    function getTargetAdminDelay(address target) public view virtual returns (uint32) {
        return _targets[target].adminDelay.get();
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
        return _groups[groupId].grantDelay.get();
    }

    /**
     * @dev Get the access details for a given account in a given group. These details include the timepoint at which
     * membership becomes active, and the delay applied to all operation by this user that requires this permission
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
            return (inGroupSince != 0 && inGroupSince <= Time.timestamp(), currentDelay);
        }
    }

    // =============================================== GROUP MANAGEMENT ===============================================
    /**
     * @dev Give a label to a group, for improved group discoverabily by UIs.
     *
     * Emits a {GroupLabel} event.
     */
    function labelGroup(uint64 groupId, string calldata label) public virtual onlyAuthorized {
        if (groupId == ADMIN_GROUP || groupId == PUBLIC_GROUP) {
            revert AccessManagerLockedGroup(groupId);
        }
        emit GroupLabel(groupId, label);
    }

    /**
     * @dev Add `account` to `groupId`, or change its execution delay.
     *
     * This gives the account the authorization to call any function that is restricted to this group. An optional
     * execution delay (in seconds) can be set. If that delay is non 0, the user is required to schedule any operation
     * that is restricted to members this group. The user will only be able to execute the operation after the delay has
     * passed, before it has expired. During this period, admin and guardians can cancel the operation (see {cancel}).
     *
     * If the account has already been granted this group, the execution delay will be updated. This update is not
     * immediate and follows the delay rules. For example, If a user currently has a delay of 3 hours, and this is
     * called to reduce that delay to 1 hour, the new delay will take some time to take effect, enforcing that any
     * operation executed in the 3 hours that follows this update was indeed scheduled before this update.
     *
     * Requirements:
     *
     * - the caller must be in the group's admins
     *
     * Emits a {GroupGranted} event
     */
    function grantGroup(uint64 groupId, address account, uint32 executionDelay) public virtual onlyAuthorized {
        _grantGroup(groupId, account, getGroupGrantDelay(groupId), executionDelay);
    }

    /**
     * @dev Remove an account for a group, with immediate effect. If the sender is not in the group, this call has no
     * effect.
     *
     * Requirements:
     *
     * - the caller must be in the group's admins
     *
     * Emits a {GroupRevoked} event
     */
    function revokeGroup(uint64 groupId, address account) public virtual onlyAuthorized {
        _revokeGroup(groupId, account);
    }

    /**
     * @dev Renounce group permissions for the calling account, with immediate effect. If the sender is not in
     * the group, this call has no effect.
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
     * @dev Change admin group for a given group.
     *
     * Requirements:
     *
     * - the caller must be a global admin
     *
     * Emits a {GroupAdminChanged} event
     */
    function setGroupAdmin(uint64 groupId, uint64 admin) public virtual onlyAuthorized {
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
    function setGroupGuardian(uint64 groupId, uint64 guardian) public virtual onlyAuthorized {
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
    function setGrantDelay(uint64 groupId, uint32 newDelay) public virtual onlyAuthorized {
        _setGrantDelay(groupId, newDelay);
    }

    /**
     * @dev Internal version of {grantGroup} without access control. Returns true if the group was newly granted.
     *
     * Emits a {GroupGranted} event
     */
    function _grantGroup(
        uint64 groupId,
        address account,
        uint32 grantDelay,
        uint32 executionDelay
    ) internal virtual returns (bool) {
        if (groupId == PUBLIC_GROUP) {
            revert AccessManagerLockedGroup(groupId);
        }

        bool inGroup = _groups[groupId].members[account].since != 0;

        uint48 since;

        if (inGroup) {
            // No setback here. Value can be reset by doing revoke + grant, effectively allowing the admin to perform
            // any change to the execution delay within the duration of the group admin delay.
            (_groups[groupId].members[account].delay, since) = _groups[groupId].members[account].delay.withUpdate(
                executionDelay,
                0
            );
        } else {
            since = Time.timestamp() + grantDelay;
            _groups[groupId].members[account] = Access({since: since, delay: executionDelay.toDelay()});
        }

        emit GroupGranted(groupId, account, executionDelay, since, !inGroup);
        return !inGroup;
    }

    /**
     * @dev Internal version of {revokeGroup} without access control. This logic is also used by {renounceGroup}.
     * Returns true if the group was previously granted.
     *
     * Emits a {GroupRevoked} event
     */
    function _revokeGroup(uint64 groupId, address account) internal virtual returns (bool) {
        if (groupId == PUBLIC_GROUP) {
            revert AccessManagerLockedGroup(groupId);
        }

        if (_groups[groupId].members[account].since == 0) {
            return false;
        }

        delete _groups[groupId].members[account];

        emit GroupRevoked(groupId, account);
        return true;
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

        uint48 effect;
        (_groups[groupId].grantDelay, effect) = _groups[groupId].grantDelay.withUpdate(newDelay, minSetback());

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
    function setTargetFunctionGroup(
        address target,
        bytes4[] calldata selectors,
        uint64 groupId
    ) public virtual onlyAuthorized {
        for (uint256 i = 0; i < selectors.length; ++i) {
            _setTargetFunctionGroup(target, selectors[i], groupId);
        }
    }

    /**
     * @dev Internal version of {setFunctionAllowedGroup} without access control.
     *
     * Emits a {FunctionAllowedGroupUpdated} event
     */
    function _setTargetFunctionGroup(address target, bytes4 selector, uint64 groupId) internal virtual {
        _targets[target].allowedGroups[selector] = groupId;
        emit TargetFunctionGroupUpdated(target, selector, groupId);
    }

    /**
     * @dev Set the delay for management operations on a given class of contract.
     *
     * Requirements:
     *
     * - the caller must be a global admin
     *
     * Emits a {FunctionAllowedGroupUpdated} event per selector
     */
    function setTargetAdminDelay(address target, uint32 newDelay) public virtual onlyAuthorized {
        _setTargetAdminDelay(target, newDelay);
    }

    /**
     * @dev Internal version of {setClassAdminDelay} without access control.
     *
     * Emits a {ClassAdminDelayUpdated} event
     */
    function _setTargetAdminDelay(address target, uint32 newDelay) internal virtual {
        uint48 effect;
        (_targets[target].adminDelay, effect) = _targets[target].adminDelay.withUpdate(newDelay, minSetback());

        emit TargetAdminDelayUpdated(target, newDelay, effect);
    }

    // =============================================== MODE MANAGEMENT ================================================
    /**
     * @dev Set the closed flag for a contract.
     *
     * Requirements:
     *
     * - the caller must be a global admin
     *
     * Emits a {TargetClosed} event.
     */
    function setTargetClosed(address target, bool closed) public virtual onlyAuthorized {
        _setTargetClosed(target, closed);
    }

    /**
     * @dev Set the closed flag for a contract. This is an internal setter with no access restrictions.
     *
     * Emits a {TargetClosed} event.
     */
    function _setTargetClosed(address target, bool closed) internal virtual {
        if (target == address(this)) {
            revert AccessManagerLockedAccount(target);
        }
        _targets[target].closed = closed;
        emit TargetClosed(target, closed);
    }

    // ============================================== DELAYED OPERATIONS ==============================================
    /**
     * @dev Return the timepoint at which a scheduled operation will be ready for execution. This returns 0 if the
     * operation is not yet scheduled, has expired, was executed, or was canceled.
     */
    function getSchedule(bytes32 id) public view virtual returns (uint48) {
        uint48 timepoint = _schedules[id].timepoint;
        return _isExpired(timepoint) ? 0 : timepoint;
    }

    /**
     * @dev Return the nonce for the latest scheduled operation with a given id. Returns 0 if the operation has never
     * been scheduled.
     */
    function getNonce(bytes32 id) public view virtual returns (uint32) {
        return _schedules[id].nonce;
    }

    /**
     * @dev Schedule a delayed operation for future execution, and return the operation identifier. It is possible to
     * choose the timestamp at which the operation becomes executable as long as it satisfies the execution delays
     * required for the caller. The special value zero will automatically set the earliest possible time.
     *
     * Returns the `operationId` that was scheduled. Since this value is a hash of the parameters, it can reoccur when
     * the same parameters are used; if this is relevant, the returned `nonce` can be used to uniquely identify this
     * scheduled operation from other occurrences of the same `operationId` in invocations of {relay} and {cancel}.
     *
     * Emits a {OperationScheduled} event.
     */
    function schedule(
        address target,
        bytes calldata data,
        uint48 when
    ) public virtual returns (bytes32 operationId, uint32 nonce) {
        address caller = _msgSender();

        // Fetch restrictions that apply to the caller on the targeted function
        (bool immediate, uint32 setback) = _canCallExtended(caller, target, data);

        uint48 minWhen = Time.timestamp() + setback;

        if (when == 0) {
            when = minWhen;
        }

        // If caller is not authorised, revert
        if (!immediate && (setback == 0 || when < minWhen)) {
            revert AccessManagerUnauthorizedCall(caller, target, bytes4(data[0:4]));
        }

        // If caller is authorised, schedule operation
        operationId = _hashOperation(caller, target, data);

        // Cannot reschedule unless the operation has expired
        uint48 prevTimepoint = _schedules[operationId].timepoint;
        if (prevTimepoint != 0 && !_isExpired(prevTimepoint)) {
            revert AccessManagerAlreadyScheduled(operationId);
        }

        unchecked {
            // It's not feasible to overflow the nonce in less than 1000 years
            nonce = _schedules[operationId].nonce + 1;
        }
        _schedules[operationId].timepoint = when;
        _schedules[operationId].nonce = nonce;
        emit OperationScheduled(operationId, nonce, when, caller, target, data);

        // Using named return values because otherwise we get stack too deep
    }

    /**
     * @dev Execute a function that is delay restricted, provided it was properly scheduled beforehand, or the
     * execution delay is 0.
     *
     * Returns the nonce that identifies the previously scheduled operation that is relayed, or 0 if the
     * operation wasn't previously scheduled (if the caller doesn't have an execution delay).
     *
     * Emits an {OperationExecuted} event only if the call was scheduled and delayed.
     */
    // Reentrancy is not an issue because permissions are checked on msg.sender. Additionally,
    // _consumeScheduledOp guarantees a scheduled operation is only executed once.
    // slither-disable-next-line reentrancy-no-eth
    function relay(address target, bytes calldata data) public payable virtual returns (uint32) {
        address caller = _msgSender();

        // Fetch restrictions that apply to the caller on the targeted function
        (bool immediate, uint32 setback) = _canCallExtended(caller, target, data);

        // If caller is not authorised, revert
        if (!immediate && setback == 0) {
            revert AccessManagerUnauthorizedCall(caller, target, bytes4(data));
        }

        // If caller is authorised, check operation was scheduled early enough
        bytes32 operationId = _hashOperation(caller, target, data);
        uint32 nonce;

        if (setback != 0) {
            nonce = _consumeScheduledOp(operationId);
        }

        // Mark the target and selector as authorised
        bytes32 relayIdentifierBefore = _relayIdentifier;
        _relayIdentifier = _hashRelayIdentifier(target, bytes4(data));

        // Perform call
        Address.functionCallWithValue(target, data, msg.value);

        // Reset relay identifier
        _relayIdentifier = relayIdentifierBefore;

        return nonce;
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
        if (IAccessManaged(target).isConsumingScheduledOp() != IAccessManaged.isConsumingScheduledOp.selector) {
            revert AccessManagerUnauthorizedConsume(target);
        }
        _consumeScheduledOp(_hashOperation(caller, target, data));
    }

    /**
     * @dev Internal variant of {consumeScheduledOp} that operates on bytes32 operationId.
     *
     * Returns the nonce of the scheduled operation that is consumed.
     */
    function _consumeScheduledOp(bytes32 operationId) internal virtual returns (uint32) {
        uint48 timepoint = _schedules[operationId].timepoint;
        uint32 nonce = _schedules[operationId].nonce;

        if (timepoint == 0) {
            revert AccessManagerNotScheduled(operationId);
        } else if (timepoint > Time.timestamp()) {
            revert AccessManagerNotReady(operationId);
        } else if (_isExpired(timepoint)) {
            revert AccessManagerExpired(operationId);
        }

        delete _schedules[operationId];
        emit OperationExecuted(operationId, nonce);

        return nonce;
    }

    /**
     * @dev Cancel a scheduled (delayed) operation. Returns the nonce that identifies the previously scheduled
     * operation that is cancelled.
     *
     * Requirements:
     *
     * - the caller must be the proposer, or a guardian of the targeted function
     *
     * Emits a {OperationCanceled} event.
     */
    function cancel(address caller, address target, bytes calldata data) public virtual returns (uint32) {
        address msgsender = _msgSender();
        bytes4 selector = bytes4(data[0:4]);

        bytes32 operationId = _hashOperation(caller, target, data);
        if (_schedules[operationId].timepoint == 0) {
            revert AccessManagerNotScheduled(operationId);
        } else if (caller != msgsender) {
            // calls can only be canceled by the account that scheduled them, a global admin, or by a guardian of the required group.
            (bool isAdmin, ) = hasGroup(ADMIN_GROUP, msgsender);
            (bool isGuardian, ) = hasGroup(getGroupGuardian(getTargetFunctionGroup(target, selector)), msgsender);
            if (!isAdmin && !isGuardian) {
                revert AccessManagerUnauthorizedCancel(msgsender, caller, target, selector);
            }
        }

        delete _schedules[operationId].timepoint;
        uint32 nonce = _schedules[operationId].nonce;
        emit OperationCanceled(operationId, nonce);

        return nonce;
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
    function updateAuthority(address target, address newAuthority) public virtual onlyAuthorized {
        IAccessManaged(target).setAuthority(newAuthority);
    }

    // ================================================= ADMIN LOGIC ==================================================
    /**
     * @dev Check if the current call is authorized according to admin logic.
     */
    function _checkAuthorized() private {
        address caller = _msgSender();
        (bool immediate, uint32 delay) = _canCallExtended(caller, address(this), _msgData());
        if (!immediate) {
            if (delay == 0) {
                (, uint64 requiredGroup, ) = _getAdminRestrictions(_msgData());
                revert AccessManagerUnauthorizedAccount(caller, requiredGroup);
            } else {
                _consumeScheduledOp(_hashOperation(caller, address(this), _msgData()));
            }
        }
    }

    /**
     * @dev Get the admin restrictions of a given function call based on the function and arguments involved.
     *
     * Returns:
     * - bool restricted: does this data match a restricted operation
     * - uint64: which group is this operation restricted to
     * - uint32: minimum delay to enforce for that operation (on top of the admin's execution delay)
     */
    function _getAdminRestrictions(bytes calldata data) private view returns (bool, uint64, uint32) {
        bytes4 selector = bytes4(data);

        if (data.length < 4) {
            return (false, 0, 0);
        }

        // Restricted to ADMIN with no delay beside any execution delay the caller may have
        if (
            selector == this.labelGroup.selector ||
            selector == this.setGroupAdmin.selector ||
            selector == this.setGroupGuardian.selector ||
            selector == this.setGrantDelay.selector ||
            selector == this.setTargetAdminDelay.selector
        ) {
            return (true, ADMIN_GROUP, 0);
        }

        // Restricted to ADMIN with the admin delay corresponding to the target
        if (
            selector == this.updateAuthority.selector ||
            selector == this.setTargetClosed.selector ||
            selector == this.setTargetFunctionGroup.selector
        ) {
            // First argument is a target.
            address target = abi.decode(data[0x04:0x24], (address));
            uint32 delay = getTargetAdminDelay(target);
            return (true, ADMIN_GROUP, delay);
        }

        // Restricted to that group's admin with no delay beside any execution delay the caller may have.
        if (selector == this.grantGroup.selector || selector == this.revokeGroup.selector) {
            // First argument is a groupId.
            uint64 groupId = abi.decode(data[0x04:0x24], (uint64));
            uint64 groupAdminId = getGroupAdmin(groupId);
            return (true, groupAdminId, 0);
        }

        return (false, 0, 0);
    }

    // =================================================== HELPERS ====================================================
    /**
     * @dev An extended version of {canCall} for internal use that considers restrictions for admin functions.
     */
    function _canCallExtended(address caller, address target, bytes calldata data) private view returns (bool, uint32) {
        if (target == address(this)) {
            (bool enabled, uint64 groupId, uint32 operationDelay) = _getAdminRestrictions(data);
            if (!enabled) {
                return (false, 0);
            }

            (bool inGroup, uint32 executionDelay) = hasGroup(groupId, caller);
            if (!inGroup) {
                return (false, 0);
            }

            // downcast is safe because both options are uint32
            uint32 delay = uint32(Math.max(operationDelay, executionDelay));
            return (delay == 0, delay);
        } else {
            bytes4 selector = bytes4(data);
            return canCall(caller, target, selector);
        }
    }

    /**
     * @dev Returns true if a schedule timepoint is past its expiration deadline.
     */
    function _isExpired(uint48 timepoint) private view returns (bool) {
        return timepoint + expiration() <= Time.timestamp();
    }
}
