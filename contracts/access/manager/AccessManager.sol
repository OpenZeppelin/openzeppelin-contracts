// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {IAccessManager} from "./IAccessManager.sol";
import {IManaged} from "./IManaged.sol";
import {Address} from "../../utils/Address.sol";
import {Context} from "../../utils/Context.sol";
import {Multicall} from "../../utils/Multicall.sol";
import {Time} from "../../utils/types/Time.sol";

contract AccessManager is Context, Multicall, IAccessManager {
    using Time for *;

    uint256 public constant ADMIN_GROUP = type(uint256).min; // 0
    uint256 public constant PUBLIC_GROUP = type(uint256).max; // 2**256-1

    mapping(address target => AccessMode mode) private _contractMode;
    mapping(address target => mapping(bytes4 selector => uint256 groupId)) private _allowedGroups;
    mapping(uint256 groupId => Group) private _groups;
    mapping(bytes32 operationId => uint48 schedule) private _schedules;

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
            return (_relayIdentifier == keccak256(abi.encodePacked(target, selector)), 0);
        } else {
            uint256 groupId = getFunctionAllowedGroup(target, selector);
            bool inGroup = hasGroup(groupId, caller);
            uint32 executeDelay = inGroup ? getAccess(groupId, caller).delay.get() : 0;
            return (inGroup && executeDelay == 0, executeDelay);
        }
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
     */
    function getAccess(uint256 groupId, address account) public view virtual returns (Access memory) {
        return _groups[groupId].members[account];
    }

    /**
     * @dev Check if a given account currently had the permission level corresponding to a given group. Note that this
     * permission might be associated with a delay. {getAccess} can provide more details.
     */
    function hasGroup(uint256 groupId, address account) public view virtual returns (bool) {
        return groupId == PUBLIC_GROUP || getAccess(groupId, account).since.isSetAndPast(Time.timestamp());
    }

    // =============================================== GROUP MANAGEMENT ===============================================
    /**
     * @dev Give permission to an account to execute function restricted to a group. Optionally, a delay can be
     * enforced for any function call, byt this user, that require this level of permission. This call is only
     * effective after a grant delay that is specific to the group being granted.
     *
     * Requirements:
     *
     * - the caller must be in the group's admins
     *
     * Emit a {GroupGranted} event
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
     * Emit a {GroupRevoked} event
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
     * Emit a {GroupRevoked} event
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
     * Emit a {GroupExecutionDelayUpdate} event
     */
    function setExecuteDelay(
        uint256 groupId,
        address account,
        uint32 newDelay
    ) public virtual onlyGroup(getGroupAdmin(groupId)) {
        _setExecuteDelay(groupId, account, newDelay, false);
    }

    /**
     * @dev Change admin group for a given group.
     *
     * Requirements:
     *
     * - the caller must be a global admin
     *
     * Emit a {GroupAdminChanged} event
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
     * Emit a {GroupGuardianChanged} event
     */
    function setGroupGuardian(uint256 groupId, uint256 guardian) public virtual onlyGroup(ADMIN_GROUP) {
        _setGroupGuardian(groupId, guardian);
    }

    /**
     * @dev Update the .
     *
     * Requirements:
     *
     * - the caller must be a global admin
     *
     * Emit a {GroupGrantDelayChanged} event
     */
    function setGrantDelay(uint256 groupId, uint32 newDelay) public virtual onlyGroup(ADMIN_GROUP) {
        _setGrantDelay(groupId, newDelay, false);
    }

    /**
     * @dev Internal version of {grantGroup} without access control.
     *
     * Emit a {GroupGranted} event
     */
    function _grantGroup(uint256 groupId, address account, uint32 grantDelay, uint32 executionDelay) internal virtual {
        if (_groups[groupId].members[account].since != 0) {
            revert AccessManagerAcountAlreadyInGroup(groupId, account);
        }

        uint48 since = Time.timestamp() + grantDelay;
        _groups[groupId].members[account] = Access({since: since, delay: executionDelay.toDelay()});

        emit GroupGranted(groupId, account, since, executionDelay);
    }

    /**
     * @dev Internal version of {revokeGroup} without access control. This logic is also used by {renounceGroup}.
     *
     * Emit a {GroupRevoked} event
     */
    function _revokeGroup(uint256 groupId, address account) internal virtual {
        if (_groups[groupId].members[account].since == 0) {
            revert AccessManagerAcountNotInGroup(groupId, account);
        }
        delete _groups[groupId].members[account];

        emit GroupRevoked(groupId, account);
    }

    /**
     * @dev Internal version of {setExecuteDelay} without access control.
     *
     * The `immediate` flag can be used to bypass the delay protection and force the new delay to take effect
     * immediately.
     *
     * Emit a {GroupExecutionDelayUpdate} event
     */
    function _setExecuteDelay(uint256 groupId, address account, uint32 newDuration, bool immediate) internal virtual {
        if (_groups[groupId].members[account].since == 0) {
            revert AccessManagerAcountNotInGroup(groupId, account);
        }

        Time.Delay newDelay = immediate
            ? Time.toDelay(newDuration)
            : _groups[groupId].members[account].delay.update(newDuration, 0); // TODO: minsetback ?

        (, , uint48 effectPoint) = newDelay.split();

        _groups[groupId].members[account].delay = newDelay;

        emit GroupExecutionDelayUpdate(groupId, account, newDuration, effectPoint);
    }

    /**
     * @dev Internal version of {setGroupAdmin} without access control.
     *
     * Emit a {GroupAdminChanged} event
     */
    function _setGroupAdmin(uint256 groupId, uint256 admin) internal virtual {
        _groups[groupId].admin = admin;

        emit GroupAdminChanged(groupId, admin);
    }

    /**
     * @dev Internal version of {setGroupGuardian} without access control.
     *
     * Emit a {GroupGuardianChanged} event
     */
    function _setGroupGuardian(uint256 groupId, uint256 guardian) internal virtual {
        _groups[groupId].guardian = guardian;

        emit GroupGuardianChanged(groupId, guardian);
    }

    /**
     * @dev Internal version of {setGrantDelay} without access control.
     *
     * The `immediate` flag can be used to bypass the delay protection and force the new delay to take effect
     * immediately.
     *
     * Emit a {GroupGrantDelayChanged} event
     */
    function _setGrantDelay(uint256 groupId, uint32 newDelay, bool immediate) internal virtual {
        Time.Delay updated = immediate ? newDelay.toDelay() : _groups[groupId].delay.update(newDelay, 0); // TODO: minsetback ?
        (, , uint48 effect) = updated.split();

        _groups[groupId].delay = updated;

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
     * Emit a {FunctionAllowedGroupUpdated} event per selector
     */
    function setFunctionAllowedGroup(
        address target,
        bytes4[] calldata selectors,
        uint256 groupId
    ) public virtual onlyGroup(ADMIN_GROUP) {
        // todo set delay or document risks
        for (uint256 i = 0; i < selectors.length; ++i) {
            _setFunctionAllowedGroup(target, selectors[i], groupId);
        }
    }

    /**
     * @dev Internal version of {setFunctionAllowedGroup} without access control.
     *
     * Emit a {FunctionAllowedGroupUpdated} event
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
    function setContractModeOpen(address target) public virtual onlyGroup(ADMIN_GROUP) {
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
     * @dev Schedule a delayed operation, and return the operation identifier.
     *
     * Emits a {Scheduled} event.
     */
    function schedule(address target, bytes calldata data) public virtual returns (bytes32) {
        address caller = _msgSender();
        bytes4 selector = bytes4(data[0:4]);

        // Fetch restriction to that apply to the caller on the targeted function
        (bool allowed, uint32 setback) = canCall(caller, target, selector);

        // If caller is not authorised, revert
        if (!allowed && setback == 0) {
            revert AccessManagerUnauthorizedCall(caller, target, selector);
        }

        // If caller is authorised, schedule operation
        bytes32 operationId = _hashOperation(caller, target, data);
        if (_schedules[operationId] != 0) {
            revert AccessManagerAlreadyScheduled(operationId);
        }
        _schedules[operationId] = Time.timestamp() + setback;

        emit Scheduled(operationId, caller, target, data);
        return operationId;
    }

    /**
     * @dev Execute a function that is delay restricted, provided it was properly scheduled beforeend, or the
     * execution delay is 0.
     *
     * Emits a {Executed} event if the call was scheduled. Unscheduled call (with no delay) do not emit that event.
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
        uint48 timepoint = _schedules[operationId];
        if (setback != 0) {
            if (timepoint == 0) {
                revert AccessManagerNotScheduled(operationId);
            }
            if (timepoint > Time.timestamp()) {
                revert AccessManagerNotReady(operationId);
            }
        }
        if (timepoint != 0) {
            delete _schedules[operationId];
            emit Executed(operationId);
        }

        // Mark the target and selector as authorised
        bytes32 relayIdentifierBefore = _relayIdentifier;
        _relayIdentifier = keccak256(abi.encodePacked(target, selector));

        // Perform call
        Address.functionCallWithValue(target, data, msg.value);

        // Reset relay identifier
        _relayIdentifier = relayIdentifierBefore;
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
        }

        // calls can only be canceled by the account that scheduled them, or by a guardian of the required group.
        if (caller != msgsender && !hasGroup(getGroupGuardian(getFunctionAllowedGroup(target, selector)), msgsender)) {
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

    // ==================================================== OTHERS ====================================================
    /**
     * @dev Change the AccessManager instance used by a contract that correctly uses this instance.
     *
     * Requirements:
     *
     * - the caller must be a global admin
     */
    function updateAuthority(IManaged target, address newAuthority) public virtual onlyGroup(ADMIN_GROUP) {
        // todo set delay or document risks
        target.updateAuthority(newAuthority);
    }
}
