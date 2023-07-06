// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {IAccessManager} from "./IAccessManager.sol";
import {IManaged} from "./IManaged.sol";
import "../../utils/Address.sol";
import "../../utils/Context.sol";
import "../../utils/types/Time.sol";

contract AccessManager is Context, IAccessManager {
    using Time for *;

    uint256 public constant ADMIN_GROUP  = type(uint256).min; // 0
    uint256 public constant PUBLIC_GROUP = type(uint256).max; // 2**256-1

    mapping(address target => AccessMode mode) private _contractMode;
    mapping(address target => mapping(bytes4 selector => uint256 group)) private _allowedGroups;
    mapping(uint256 group => Group) private _groups;
    mapping(bytes32 => Time.Timepoint) private _schedules;

    // This should be transcient storage when supported by the EVM.
    bytes32 private _relayIdentifier;

    /**
     * @dev A delay operation was schedule.
     */
    event Scheduled(bytes32 id, address caller, address target, bytes data);

    /**
     * @dev A scheduled operation was executed.
     */
    event Executed(bytes32);

    /**
     * @dev A scheduled operation was canceled.
     */
    event Canceled(bytes32);

    error AccessManagerAlreadyScheduled(bytes32 id);
    error AccessManagerNotScheduled(bytes32 id);
    error AccessManagerNotReady(bytes32 id);
    error AccessManagerAcountAlreadyInGroup(uint256 group, address account);
    error AccessManagerAcountNotInGroup(uint256 group, address account);
    error AccessManagerBadConfirmation();
    error AccessControlUnauthorizedAccount(address msgsender, uint256 group);
    error AccessManagerUnauthorizedCall(address caller, address target, bytes4 selector);
    error AccessManagerCannotCancel(address msgsender, address caller, address target, bytes4 selector);

    /**
     * @dev Check that the caller has a given permission level (`group`). Note that this does NOT consider execution
     * delays that may be associated to that group.
     */
    modifier onlyGroup(uint256 group) {
        address msgsender = _msgSender();
        if (!hasGroup(group, msgsender)) {
            revert AccessControlUnauthorizedAccount(msgsender, group);
        }
        _;
    }

    constructor(address initialAdmin) {
        // admin is active immediatly and without any execution delay.
        _grantRole(ADMIN_GROUP, initialAdmin, 0.toDuration(), 0.toDuration());
    }

    // =================================================== GETTERS ====================================================
    /**
     * @dev Check if an address (`caller`) is authorised to call a given function on a given contract. Additionally,
     * returns the delay needed to perform the call. If there is a delay, the call must be scheduled (with {schedule})
     * and executed (with {relay}).
     *
     * This function is usually called by the targeted contract to control immediate execution of restricted functions.
     * Therefore we only return true is the call can be performed without any delay. If the call is subject to a delay,
     * then the function should return false, and the caller should schedule the operation for future execution.
     *
     * We may be able to hash the operation, and check if the call was scheduled, but we would not be able to cleanup
     * the schedule, leaving the possibility of multiple executions. Maybe this function should not be view?
     */
    function canCall(address caller, address target, bytes4 selector) public view virtual returns (bool, uint32) {
        AccessMode mode = getContractMode(target);
        if (mode == AccessMode.Open) {
            return (true, 0);
        } else if (mode == AccessMode.Closed) {
            return (false, Time.MAX_DURATION.get()); // use 0 ?
        } else if (caller == address(this)) {
            // Caller is AccessManager => call was relayed. In that case the relay already checked permissions. We
            // verify that the call "identifier", which is set during the relay call, is correct.
            bool isRelayedCall = _relayIdentifier == keccak256(abi.encodePacked(target, selector));
            return (isRelayedCall, isRelayedCall ? 0 : Time.MAX_DURATION.get());
        } else {
            uint256 group = getFunctionAllowedGroup(target, selector);
            Access memory access = _groups[group].members[caller];
            Time.Duration delay = (group == PUBLIC_GROUP || access.since.isSetAndPast())
                ? access.delay.get()
                : Time.MAX_DURATION;
            return (true, delay.get());
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
     * @dev Get the group that acts as an admin for given group.
     *
     * The admin permission is required to grant the group, revoke the group and update the execution delay to execute
     * an action that is restricted to this group.
     */
    function getGroupAdmin(uint256 group) public view virtual returns (uint256) {
        return _groups[group].admin;
    }

    /**
     * @dev Get the group that acts as a guardian for a given group.
     *
     * The guardian permssion allows canceling actions that have been scheduled under the group.
     */
    function getGroupGuardian(uint256 group) public view virtual returns (uint256) {
        return _groups[group].guardian;
    }

    /**
     * @dev Get the access details for a given account in a given group. These details include the timepoint at which
     * membership becomes active, and the delay applied to all action by this user that require this permission level.
     */
    function getAccess(uint256 group, address account) public view virtual returns (Access memory) {
        return _groups[group].members[account];
    }

    /**
     * @dev Check if a given account currently had the permission level corresponding to a given group. Note that this
     * permission might be associated with a delay. {getAccess} can provide more details.
     */
    function hasGroup(uint256 group, address account) public view virtual returns (bool) {
        return getAccess(group, account).since.isSetAndPast();
    }

    // =============================================== GROUP MANAGEMENT ===============================================
    /**
     * @dev Give permission to an account to execute function restricted to a group. Optionnaly, a delay can be
     * enforced for any function call, byt this user, that require this level of permission. This call is only
     * effective after a grant delay that is specific to the group being granted.
     *
     * Requirements:
     *
     * - the caller must be in the group's admins
     *
     * todo: emit an event
     */
    function grantRole(uint256 group, address account, uint32 executionDelay) public virtual onlyGroup(getGroupAdmin(group)) {
        _grantRole(group, account, _groups[group].delay.get(), executionDelay.toDuration());
    }

    /**
     * @dev Remove an account for a group, with immediate effect.
     *
     * Requirements:
     *
     * - the caller must be in the group's admins
     *
     * todo: emit an event
     */
    function revokeRole(uint256 group, address account) public virtual onlyGroup(getGroupAdmin(group)) {
        _revokeRole(group, account);
    }

    /**
     * @dev Renounce group permissions for the calling account, with immediate effect.
     *
     * Requirements:
     *
     * - the caller must be `callerConfirmation`.
     *
     * todo: emit an event
     */
    function renounceRole(uint256 group, address callerConfirmation) public virtual {
        if (callerConfirmation != _msgSender()) {
            revert AccessManagerBadConfirmation();
        }
        _revokeRole(group, callerConfirmation);
    }

    /**
     * @dev Set the execution delay for a given account in a given group. This update is not immediate and follows the
     * delay rules. For example, If a user currently has a delay of 3 hours, and this is called to reduce that delay to
     * 1 hour, the new delay will take some time to take effect, enforcing that any action executed in the 3 hours that
     * follows this update was indeed scheduled before this update.
     *
     * Requirements:
     *
     * - the caller must be in the group's admins
     *
     * todo: emit an event
     */
    function setExecuteDelay(uint256 group, address account, uint32 newDelay) public virtual onlyGroup(getGroupAdmin(group)){
        _setExecuteDelay(group, account, newDelay.toDuration(), false);
    }

    /**
     * @dev Change admin group for a given group.
     *
     * Requirements:
     *
     * - the caller must be a global admin
     *
     * todo: emit an event
     */
    function setGroupAdmin(uint256 group, uint256 admin) public virtual onlyGroup(ADMIN_GROUP) {
        _setGroupAdmin(group, admin);
    }

    /**
     * @dev Change guardian group for a given group.
     *
     * Requirements:
     *
     * - the caller must be a global admin
     *
     * todo: emit an event
     */
    function setGroupGuardian(uint256 group, uint256 guardian) public virtual onlyGroup(ADMIN_GROUP) {
        _setGroupGuardian(group, guardian);
    }

    /**
     * @dev Update the .
     *
     * Requirements:
     *
     * - the caller must be a global admin
     *
     * todo: emit an event
     */
    function setGrantDelay(uint256 group, uint32 newDelay) public virtual onlyGroup(ADMIN_GROUP) {
        _setGrantDelay(group, newDelay.toDuration(), false);
    }

    /**
     * @dev Internal version of {grantRole} without access control.
     *
     * todo: emit an event
     */
    function _grantRole(uint256 group, address account, Time.Duration grantDelay, Time.Duration executionDelay) internal virtual {
        if (_groups[group].members[account].since.isSet()) {
            revert AccessManagerAcountAlreadyInGroup(group, account);
        }
        _groups[group].members[account] = Access({
            since: Time.clock().add(grantDelay),
            delay: executionDelay.toDelay()
        });
        // todo emit event
    }

    /**
     * @dev Internal version of {revokeRole} without access control. This logic is also used by {renounceRole}.
     *
     * todo: emit an event
     */
    function _revokeRole(uint256 group, address account) internal virtual {
        if (!_groups[group].members[account].since.isSet()) {
            revert AccessManagerAcountNotInGroup(group, account);
        }
        delete _groups[group].members[account];
        // todo emit event
    }

    /**
     * @dev Internal version of {setExecuteDelay} without access control.
     *
     * The `immediate` flag can be used to bypass the delay protection and force the new delay to take effect
     * immediatly.
     *
     * todo: emit an event
     */
    function _setExecuteDelay(uint256 group, address account, Time.Duration newDuration, bool immediate) internal virtual {
        if (!_groups[group].members[account].since.isSet()) {
            revert AccessManagerAcountNotInGroup(group, account);
        }

        // Here, we cannot use the "normal" `update` workflow because the delay is checked at execution and not
        // enforced when scheduling.
        //
        // For example if we used `update`, the following would be possible:
        // - update from 3h to 1h.
        // - new schedule takes effect in 2h
        // - schedule (mark an initiation timepoint) in 1h
        //   - just 1h after that the timepoint will be 1h old,
        //     - since that is the new delay execution is possible.
        // - 2h after the update, an execution is possible.

        Time.Duration oldDuration = _groups[group].members[account].delay.get();

        _groups[group].members[account].delay = (immediate || oldDuration.get() < newDuration.get())
            ? newDuration.toDelay()
            : Time.pack(oldDuration, newDuration, Time.clock().add(oldDuration));

        // todo emit event
    }

    /**
     * @dev Internal version of {setGroupAdmin} without access control.
     *
     * todo: emit an event
     */
    function _setGroupAdmin(uint256 group, uint256 admin) internal virtual {
        _groups[group].admin = admin;
        // todo emit event
    }

    /**
     * @dev Internal version of {setGroupGuardian} without access control.
     *
     * todo: emit an event
     */
    function _setGroupGuardian(uint256 group, uint256 guardian) internal virtual {
        _groups[group].guardian = guardian;
        // todo emit event
    }

    /**
     * @dev Internal version of {setGrantDelay} without access control.
     *
     * The `immediate` flag can be used to bypass the delay protection and force the new delay to take effect
     * immediatly.
     *
     * todo: emit an event
     */
    function _setGrantDelay(uint256 group, Time.Duration newDelay, bool immediate) internal virtual {
        _groups[group].delay = immediate
            ? newDelay.toDelay()
            : _groups[group].delay.update(newDelay);
        // todo emit event
    }

    // ============================================= FUNCTION MANAGEMENT ==============================================
    /**
     * @dev Set the level of permission (`group`) required to call functions indentified by the `selectors` in the
     * `target` contract.
     *
     * Requirements:
     *
     * - the caller must be a global admin
     *
     * todo: emit an event
     */
    function setFunctionAllowedGroup(
        address target,
        bytes4[] calldata selectors,
        uint256 group
    ) public virtual onlyGroup(ADMIN_GROUP) { // todo set delay or document risks
        for (uint256 i = 0; i < selectors.length; ++i) {
            _setFunctionAllowedGroup(target, selectors[i], group);
        }
        // todo emit event
    }

    /**
     * @dev Internal version of {setFunctionAllowedGroup} without access control.
     *
     * todo: emit an event
     */
    function _setFunctionAllowedGroup(address target, bytes4 selector, uint256 group) internal virtual {
        _allowedGroups[target][selector] = group;
        // todo emit event
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
     * todo: emit an event
     */
    function setContractModeCustom(address target) public virtual onlyGroup(ADMIN_GROUP) { // todo set delay or document risks
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
     * todo: emit an event
     */
    function setContractModeOpen(address target) public virtual onlyGroup(ADMIN_GROUP) { // todo set delay or document risks
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
     * todo: emit an event
     */
    function setContractModeClosed(address target) public virtual onlyGroup(ADMIN_GROUP) { // todo set delay or document risks
        _setContractMode(target, AccessMode.Closed);
    }

    /**
     * @dev Set the operating mode of a contract. This is an internal setter with no access restrictions.
     *
     * todo: emit an event
     */
    function _setContractMode(address target, AccessMode mode) internal virtual {
        _contractMode[target] = mode;
        // todo emit event
    }

    // =============================================== DELAYED ACTIONS ================================================
    /**
     * @dev Return the timepoint at which an action was scheduled.
     */
    function getSchedule(bytes32 id) public virtual returns (Time.Timepoint) {
        return _schedules[id];
    }

    /**
     * @dev Schedule a delayed action, and return the action identifier.
     *
     * Emits an {Scheduled} event.
     */
    function schedule(address target, bytes calldata data) public virtual returns (bytes32) {
        address caller = _msgSender();

        bytes32 id = _hashOperation(caller, target, data);
        if (_schedules[id].isSet()) {
            revert AccessManagerAlreadyScheduled(id);
        }
        _schedules[id] = Time.clock();

        emit Scheduled(id, caller, target, data);

        return id;
    }

    /**
     * @dev Execute a function that is delay restricted, provided it was properly scheduled beforeend, or the
     * execution delay is 0.
     *
     * Emits an {Executed} event if the call was scheduled. Unscheduled call (with no delay) do not emit that event.
     */
    function relay(address target, bytes calldata data) public payable virtual {
        address caller = _msgSender();
        bytes4 selector = bytes4(data[0:4]);

        // Fetch restriction to that apply to the caller on the targeted function
        (bool allowed, uint32 setback) = canCall(caller, target, selector);

        // If caller is not authorised, revert
        if (!allowed) {
            revert AccessManagerUnauthorizedCall(caller, target, selector);
        }

        // If caller is authorised, check operation was scheduled early enough
        bytes32 id = _hashOperation(caller, target, data);
        Time.Timepoint timepoint = _schedules[id];
        if (setback != 0) {
            if (!timepoint.isSet()) {
                revert AccessManagerNotScheduled(id);
            }
            if (!timepoint.add(setback.toDuration()).isPast()) {
                revert AccessManagerNotReady(id);
            }
        }
        if (timepoint.isSet()) {
            _schedules[id] = 0.toTimepoint(); // delete
            emit Executed(id);
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

        // calls can only be canceled by the account that scheduled them, or by a guardian of the required group.
        if (
            caller != msgsender ||
            hasGroup(getGroupGuardian(getFunctionAllowedGroup(target, selector)), msgsender)
        ) {
            revert AccessManagerCannotCancel(msgsender, caller, target, selector);
        }

        bytes32 id = _hashOperation(caller, target, data);
        if (!_schedules[id].isSet()) {
            revert AccessManagerNotScheduled(id);
        }
        _schedules[id] = 0.toTimepoint(); // delete

        emit Canceled(id);
    }

    /**
     * @dev Hashing function for delayed actions
     */
    function _hashOperation(address caller, address target, bytes calldata data) private pure returns (bytes32) {
        return keccak256(abi.encode(caller, target, data));
    }

    // ==================================================== OTHERS ====================================================
    /**
     * @dev Change the AccessManager instance used by a contract that correctly uses this instace.
     *
     * Requirements:
     *
     * - the caller must be a global admin
     */
    function updateAuthority(IManaged target, address newAuthority) public virtual onlyGroup(ADMIN_GROUP) { // todo set delay or document risks
        target.updateAuthority(newAuthority);
    }
}
