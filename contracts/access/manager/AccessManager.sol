// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {IAccessManager} from "./IAccessManager.sol";
import {IManaged} from "./IManaged.sol";
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

    uint256 public constant ADMIN_GROUP = type(uint256).min; // 0
    uint256 public constant PUBLIC_GROUP = type(uint256).max; // 2**256-1

    mapping(address target => AccessMode mode) private _contractMode;
    mapping(address target => mapping(bytes4 selector => uint256 groupId)) private _allowedGroups;
    mapping(uint256 groupId => Group) private _groups;
    mapping(bytes32 operationId => uint48 schedule) private _schedules;
    mapping(bytes4 selector => Time.Delay delay) private _adminDelays;

    // This should be transcient storage when supported by the EVM.
    bytes32 private _relayIdentifier;

    /**
     * @dev Check that the caller has a given permission level (`groupId`). Note that this does NOT consider execution
     * delays that may be associated to that group.
     */
    modifier onlyGroup(uint256 groupId) {
        address msgsender = _msgSender();
        if (!hasGroup(groupId, msgsender)) {
            revert AccessControlUnauthorizedAccount(msgsender, groupId);
        }
        _;
    }

    /**
     * @dev Check that the caller is an admin and that the top-level function currently executing has been scheduled
     * sufficiently ahead of time, if necessary according to admin delays.
     */
    modifier onlyDelayedAdmin() {
        address msgsender = _msgSender();
        (bool allowed, uint32 delay) = canCall(msgsender, address(this), msg.sig);
        if (delay > 0) {
            _consumeScheduledOp(_hashOperation(msgsender, address(this), _msgData()));
        } else if (!allowed) {
            revert AccessControlUnauthorizedAccount(msgsender, ADMIN_GROUP);
        }
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
        AccessMode mode = getContractMode(target);
        if (mode == AccessMode.Open) {
            return (true, 0);
        } else if (mode == AccessMode.Closed) {
            return (false, 0);
        } else if (caller == address(this)) {
            // Caller is AccessManager => call was relayed. In that case the relay already checked permissions. We
            // verify that the call "identifier", which is set during the relay call, is correct.
            return (_relayIdentifier == _hashRelayIdentifier(target, selector), 0);
        } else if (target == address(this)) {
            bool allowed = hasGroup(ADMIN_GROUP, caller);
            uint32 delay = _adminDelays[selector].get();
            return (allowed && delay == 0, delay);
        } else {
            uint256 groupId = getFunctionAllowedGroup(target, selector);
            bool inGroup = hasGroup(groupId, caller);
            if (!inGroup) {
                return (false, 0);
            } else {
                (, uint32 currentDelay, , ) = getAccess(groupId, caller);
                return (currentDelay == 0, currentDelay);
            }
        }
    }

    /**
     * @dev Expiration delay for scheduled proposals. Defaults to 1 week.
     */
    function expiration() public view virtual returns (uint48) {
        return 1 weeks;
    }

    /**
     * @dev Get the mode under which a contract is operating.
     */
    function getContractMode(address target) public view virtual returns (AccessMode) {
        return _contractMode[target];
    }

    /**
     * @dev Get the permission level (group) required to call a function. This only applies for contract that are
     * operating under the `Custom` mode.
     */
    function getFunctionAllowedGroup(address target, bytes4 selector) public view virtual returns (uint256) {
        return _allowedGroups[target][selector];
    }

    /**
     * @dev Get the id of the group that acts as an admin for given group.
     *
     * The admin permission is required to grant the group, revoke the group and update the execution delay to execute
     * an operation that is restricted to this group.
     */
    function getGroupAdmin(uint256 groupId) public view virtual returns (uint256) {
        return _groups[groupId].admin;
    }

    /**
     * @dev Get the group that acts as a guardian for a given group.
     *
     * The guardian permission allows canceling operations that have been scheduled under the group.
     */
    function getGroupGuardian(uint256 groupId) public view virtual returns (uint256) {
        return _groups[groupId].guardian;
    }

    /**
     * @dev Get the group current grant delay, that value may change at any point, without an event emitted, following
     * a call to {setGrantDelay}. Changes to this value, including effect timepoint are notified by the
     * {GroupGrantDelayChanged} event.
     */
    function getGroupGrantDelay(uint256 groupId) public view virtual returns (uint32) {
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
    function getAccess(uint256 groupId, address account) public view virtual returns (uint48, uint32, uint32, uint48) {
        Access storage access = _groups[groupId].members[account];

        uint48 since = access.since;
        (uint32 oldDelay, uint32 newDelay, uint48 effect) = access.delay.split();

        return effect.isSetAndPast(Time.timestamp()) ? (since, newDelay, 0, 0) : (since, oldDelay, newDelay, effect);
    }

    /**
     * @dev Check if a given account currently had the permission level corresponding to a given group. Note that this
     * permission might be associated with a delay. {getAccess} can provide more details.
     */
    function hasGroup(uint256 groupId, address account) public view virtual returns (bool) {
        if (groupId == PUBLIC_GROUP) {
            return true;
        } else {
            (uint48 inGroupSince, , , ) = getAccess(groupId, account);
            return inGroupSince.isSetAndPast(Time.timestamp());
        }
    }

    // =============================================== GROUP MANAGEMENT ===============================================
    /**
     * @dev Give a label to a group, for improved group discoverabily by UIs.
     *
     * Emits a {GroupLabel} event.
     */
    function labelGroup(uint256 groupId, string calldata label) public virtual onlyGroup(ADMIN_GROUP) {
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
        uint256 groupId,
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
    function revokeGroup(uint256 groupId, address account) public virtual onlyGroup(getGroupAdmin(groupId)) {
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
    function renounceGroup(uint256 groupId, address callerConfirmation) public virtual {
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
        uint256 groupId,
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
    function setGroupAdmin(uint256 groupId, uint256 admin) public virtual onlyGroup(ADMIN_GROUP) {
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
    function setGroupGuardian(uint256 groupId, uint256 guardian) public virtual onlyGroup(ADMIN_GROUP) {
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
    function setGrantDelay(uint256 groupId, uint32 newDelay) public virtual onlyDelayedAdmin {
        _setGrantDelay(groupId, newDelay);
    }

    /**
     * @dev Internal version of {grantGroup} without access control.
     *
     * Emits a {GroupGranted} event
     */
    function _grantGroup(uint256 groupId, address account, uint32 grantDelay, uint32 executionDelay) internal virtual {
        if (groupId == PUBLIC_GROUP) {
            revert AccessManagerLockedGroup(groupId);
        } else if (_groups[groupId].members[account].since != 0) {
            revert AccessManagerAcountAlreadyInGroup(groupId, account);
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
    function _revokeGroup(uint256 groupId, address account) internal virtual {
        if (groupId == PUBLIC_GROUP) {
            revert AccessManagerLockedGroup(groupId);
        } else if (_groups[groupId].members[account].since == 0) {
            revert AccessManagerAcountNotInGroup(groupId, account);
        }

        delete _groups[groupId].members[account];

        emit GroupRevoked(groupId, account);
    }

    /**
     * @dev Internal version of {setExecuteDelay} without access control.
     *
     * Emits a {GroupExecutionDelayUpdated} event.
     */
    function _setExecuteDelay(uint256 groupId, address account, uint32 newDuration) internal virtual {
        if (groupId == PUBLIC_GROUP) {
            revert AccessManagerLockedGroup(groupId);
        } else if (_groups[groupId].members[account].since == 0) {
            revert AccessManagerAcountNotInGroup(groupId, account);
        }

        Time.Delay newDelay = _groups[groupId].members[account].delay.update(newDuration, 0); // TODO: minsetback ?
        _groups[groupId].members[account].delay = newDelay;

        (, , uint48 effectPoint) = newDelay.split();
        emit GroupExecutionDelayUpdated(groupId, account, newDuration, effectPoint);
    }

    /**
     * @dev Internal version of {setGroupAdmin} without access control.
     *
     * Emits a {GroupAdminChanged} event
     */
    function _setGroupAdmin(uint256 groupId, uint256 admin) internal virtual {
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
    function _setGroupGuardian(uint256 groupId, uint256 guardian) internal virtual {
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
    function _setGrantDelay(uint256 groupId, uint32 newDelay) internal virtual {
        if (groupId == PUBLIC_GROUP) {
            revert AccessManagerLockedGroup(groupId);
        }

        Time.Delay updated = _groups[groupId].delay.update(newDelay, 0); // TODO: minsetback ?
        _groups[groupId].delay = updated;

        (, , uint48 effect) = updated.split();
        emit GroupGrantDelayChanged(groupId, newDelay, effect);
    }

    /**
     * @dev Set the execution delay for an admin function of the AccessManager. This update is not
     * immediate and follows the same rules of {setExecuteDelay}.
     *
     * Emits an {AdminDelayUpdated} event.
     */
    function setAdminFunctionDelay(bytes4 selector, uint32 newDelay) public virtual onlyGroup(ADMIN_GROUP) {
        _setAdminFunctionDelay(selector, newDelay);
    }

    /**
     * @dev Internal version of {setAdminFunctionDelay} without access control.
     *
     * Emits an {AdminDelayUpdated} event
     */
    function _setAdminFunctionDelay(bytes4 selector, uint32 newDelay) internal virtual {
        Time.Delay updated = _adminDelays[selector].update(newDelay, 0); // TODO: minsetback ?
        _adminDelays[selector] = updated;
        (, , uint48 effectPoint) = updated.split();
        emit AdminDelayUpdated(selector, newDelay, effectPoint);
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
    function setFunctionAllowedGroup(
        address target,
        bytes4[] calldata selectors,
        uint256 groupId
    ) public virtual onlyDelayedAdmin {
        // todo set delay or document risks
        for (uint256 i = 0; i < selectors.length; ++i) {
            _setFunctionAllowedGroup(target, selectors[i], groupId);
        }
    }

    /**
     * @dev Internal version of {setFunctionAllowedGroup} without access control.
     *
     * Emits a {FunctionAllowedGroupUpdated} event
     */
    function _setFunctionAllowedGroup(address target, bytes4 selector, uint256 groupId) internal virtual {
        _allowedGroups[target][selector] = groupId;
        emit FunctionAllowedGroupUpdated(target, selector, groupId);
    }

    // =============================================== MODE MANAGEMENT ================================================
    /**
     * @dev Set the operating mode of a contract to Custom. This enables the group mechanism for per-function access
     * restriction and delay enforcement.
     *
     * Requirements:
     *
     * - the caller must be a global admin
     *
     * Emits a {AccessModeUpdated} event.
     */
    function setContractModeCustom(address target) public virtual onlyGroup(ADMIN_GROUP) {
        // todo set delay or document risks
        _setContractMode(target, AccessMode.Custom);
    }

    /**
     * @dev Set the operating mode of a contract to Open. This allows anyone to call any `restricted()` function with
     * no delay.
     *
     * Requirements:
     *
     * - the caller must be a global admin
     *
     * Emits a {AccessModeUpdated} event.
     */
    function setContractModeOpen(address target) public virtual onlyDelayedAdmin {
        // todo set delay or document risks
        _setContractMode(target, AccessMode.Open);
    }

    /**
     * @dev Set the operating mode of a contract to Close. This prevents anyone from calling any `restricted()`
     * function.
     *
     * Requirements:
     *
     * - the caller must be a global admin
     *
     * Emits a {AccessModeUpdated} event.
     */
    function setContractModeClosed(address target) public virtual onlyGroup(ADMIN_GROUP) {
        // todo set delay or document risks
        _setContractMode(target, AccessMode.Closed);
    }

    /**
     * @dev Set the operating mode of a contract. This is an internal setter with no access restrictions.
     *
     * Emits a {AccessModeUpdated} event.
     */
    function _setContractMode(address target, AccessMode mode) internal virtual {
        _contractMode[target] = mode;
        emit AccessModeUpdated(target, mode);
    }

    // ============================================== DELAYED OPERATIONS ==============================================
    /**
     * @dev Return the timepoint at which a scheduled operation will be ready for execution. This returns 0 if the
     * operation is not yet scheduled, was executed or was canceled.
     */
    function getSchedule(bytes32 id) public view virtual returns (uint48) {
        return _schedules[id];
    }

    /**
     * @dev Schedule a delayed operation for future execution, and return the operation identifier. It is possible to
     * choose the timestamp at which the operation becomes executable as long as it satisfies the execution delays
     * required for the caller. The special value zero will automatically set the earliest possible time.
     *
     * Emits a {Scheduled} event.
     */
    function schedule(address target, bytes calldata data, uint48 when) public virtual returns (bytes32) {
        address caller = _msgSender();
        bytes4 selector = bytes4(data[0:4]);

        // Fetch restriction to that apply to the caller on the targeted function
        (bool allowed, uint32 setback) = canCall(caller, target, selector);

        uint48 minWhen = Time.timestamp() + setback;

        // If caller is not authorised, revert
        if (!allowed && (setback == 0 || when.isSetAndPast(minWhen - 1))) {
            revert AccessManagerUnauthorizedCall(caller, target, selector);
        }

        // If caller is authorised, schedule operation
        bytes32 operationId = _hashOperation(caller, target, data);
        uint48 timepoint = _schedules[operationId];
        // Cannot reschedule unless the operation has expired
        if (timepoint != 0 && timepoint + expiration() >= Time.timestamp()) {
            revert AccessManagerAlreadyScheduled(operationId);
        }
        _schedules[operationId] = when == 0 ? minWhen : when;

        emit Scheduled(operationId, caller, target, data);
        return operationId;
    }

    /**
     * @dev Execute a function that is delay restricted, provided it was properly scheduled beforehand, or the
     * execution delay is 0.
     *
     * Emits an {Executed} event if the call was scheduled. Unscheduled calls (with no delay) do not emit that event.
     */
    function relay(address target, bytes calldata data) public payable virtual {
        address caller = _msgSender();
        bytes4 selector = bytes4(data[0:4]);

        // Fetch restriction to that apply to the caller on the targeted function
        (bool allowed, uint32 setback) = canCall(caller, target, selector);

        // If caller is not authorised, revert
        if (!allowed && setback == 0) {
            revert AccessManagerUnauthorizedCall(caller, target, selector);
        }

        // If caller is authorised, check operation was scheduled early enough
        bytes32 operationId = _hashOperation(caller, target, data);

        if (setback != 0) {
            _consumeScheduledOp(operationId);
        } else if (_schedules[operationId] != 0) {
            delete _schedules[operationId];
            emit Executed(operationId);
        }

        // Mark the target and selector as authorised
        bytes32 relayIdentifierBefore = _relayIdentifier;
        _relayIdentifier = _hashRelayIdentifier(target, selector);

        // Perform call
        Address.functionCallWithValue(target, data, msg.value);

        // Reset relay identifier
        _relayIdentifier = relayIdentifierBefore;
    }

    /**
     * @dev Consume a scheduled operation targeting the caller. If such an operation exists, mark it as consumed
     * (emit an {Executed} event and clean the state). Otherwise, throw an error.
     *
     * This is useful for contract that want to enforce that calls targeting them were scheduled on the manager,
     * with all the verifications that it implies.
     *
     * Emit a {Executed} event
     */
    function consumeScheduledOp(address caller, bytes calldata data) public virtual {
        address target = _msgSender();
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
        } else if (timepoint + expiration() <= Time.timestamp()) {
            revert AccessManagerExpired(operationId);
        }

        delete _schedules[operationId];
        emit Executed(operationId);
    }

    /**
     * @dev Cancel a scheduled (delayed) operation.
     *
     * Requirements:
     *
     * - the caller must be the proposer, or a guardian of the targeted function
     *
     * Emits a {Canceled} event.
     */
    function cancel(address caller, address target, bytes calldata data) public virtual {
        address msgsender = _msgSender();
        bytes4 selector = bytes4(data[0:4]);

        bytes32 operationId = _hashOperation(caller, target, data);
        if (_schedules[operationId] == 0) {
            revert AccessManagerNotScheduled(operationId);
        } else if (
            caller != msgsender &&
            !hasGroup(ADMIN_GROUP, msgsender) &&
            !hasGroup(getGroupGuardian(getFunctionAllowedGroup(target, selector)), msgsender)
        ) {
            // calls can only be canceled by the account that scheduled them, a global admin, or by a guardian of the required group.
            revert AccessManagerCannotCancel(msgsender, caller, target, selector);
        }

        delete _schedules[operationId];
        emit Canceled(operationId);
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
    function updateAuthority(IManaged target, address newAuthority) public virtual onlyDelayedAdmin {
        // todo set delay or document risks
        target.setAuthority(newAuthority);
    }
}
