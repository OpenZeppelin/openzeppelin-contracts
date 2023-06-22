// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import "./IAuthority.sol";
import "./IManaged.sol";
import "../../utils/Address.sol";
import "../../utils/Context.sol";
import "../../utils/types/Time.sol";






contract DelayedActions is Context {
    using Time for *;

    mapping(bytes32 => Time.Timepoint) private _schedules; // todo: add accessor

    event Scheduled(bytes32, address, address, bytes);
    event Executed(bytes32);
    event Canceled(bytes32);

    function schedule(address target, bytes calldata data) public virtual returns (bytes32) {
        return _schedule(_msgSender(), target, data);
    }

    function _schedule(address caller, address target, bytes calldata data) internal virtual returns (bytes32) {
        bytes32 id = _hashOperation(caller, target, data);
        require(!_schedules[id].isSet(), "Already scheduled");
        _schedules[id] = Time.clock();
        emit Scheduled(id, caller, target, data);
        return id;
    }

    function _executeCheck(bytes32 id, Time.Duration setback) internal virtual {
        if (setback.get() != 0) {
            Time.Timepoint timepoint = _schedules[id];
            require(timepoint.isSet(), "missing schedule");
            require(timepoint.add(setback).isPast(), "not ready");
        }
        _schedules[id] = 0.toTimepoint(); // delete
        emit Executed(id);
    }

    function _cancel(bytes32 id) internal virtual {
        require(_schedules[id].isSet(), "invalid schedule");
        _schedules[id] = 0.toTimepoint(); // delete
        emit Canceled(id);
    }

    function _hashOperation(address caller, address target, bytes calldata data) internal virtual pure returns (bytes32) {
        return keccak256(abi.encode(caller, target, data));
    }
}





contract AccessManager is IAuthority, DelayedActions {
    using Time for *;

    enum AccessMode { Custom, Closed, Open }

    // Structure fit into 1 slot: timepoint is uint48 and delay is uint128
    struct Access {
        Time.Timepoint since;
        Time.Delay delay; // delay for execution
    }

    struct Group {
        mapping(address user => Access access) members;
        bytes32 admin;
        bytes32 guardian;
        Time.Delay delay; // delay for granting
    }

    bytes32 public constant ADMIN_GROUP  = bytes32(type(uint256).min); // 0
    bytes32 public constant PUBLIC_GROUP = bytes32(type(uint256).max); // 2**256-1

    mapping(address target => AccessMode mode) private _contractMode;
    mapping(address target => mapping(bytes4 selector => bytes32 group)) private _allowedGroups;
    mapping(bytes32 group => Group) private _groups;

    modifier onlyGroup(bytes32 group) {
        require(hasGroup(group, _msgSender()));
        _;
    }

    constructor(address initialAdmin) {
        // admin is active immediatly and without any execution delay.
        _grantRole(ADMIN_GROUP, initialAdmin, 0.toDuration(), 0.toDuration());
    }

    // =================================================== GETTERS ====================================================
    /**
     * @dev Check if an address (`caller`) is authorised to call a given function on a given contract.
     *
     * This function is usually called by the targeted contract to control immediate execution of restricted functions.
     * Therefore we only return true is the call can be performed without any delay. If the call is subject to a delay,
     * then the function should return false, and the caller should schedule the operation for future execution.
     *
     * We may be able to hash the operation, and check if the call was scheduled, but we would not be able to cleanup
     * the schedule, leaving the possibility of multiple executions. Maybe this function should not be view?
     */
    function canCall(address caller, address target, bytes4 selector) public view virtual returns (bool allowed) {
        return callDelay(caller, target, selector).get() == 0;
    }

    /**
     * @dev Get the delay applied to a given function call by a given user.
     *
     * This function returns 0 is there is no delay, and the function can be called immediatly. It also returns
     * MAX_DURATION (~34842 years) if the call is forbidden.
     */
    function callDelay(address caller, address target, bytes4 selector) public view virtual returns (Time.Duration) {
        AccessMode mode = getContractMode(target);
        if (mode == AccessMode.Open) {
            return 0.toDuration(); // no delay = can call immediatly
        } else if (mode == AccessMode.Closed) {
            return Time.MAX_DURATION; // "infinite" delay
        } else if (caller == address(this)) {
            return 0.toDuration();
        } else {
            bytes32 group = getFunctionAllowedGroup(target, selector);
            Access storage access = _groups[group].members[caller]; // todo: memory ?

            return (group == PUBLIC_GROUP || access.since.isSetAndPast())
                ? access.delay.get()
                : Time.MAX_DURATION;
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
    function getFunctionAllowedGroup(address target, bytes4 selector) public view virtual returns (bytes32) {
        return _allowedGroups[target][selector];
    }

    /**
     * @dev Get the group that acts as an admin for given group.
     *
     * The admin permission is required to grant the group, revoke the group and update the execution delay to execute
     * an action that is restricted to this group.
     */
    function getGroupAdmin(bytes32 group) public view virtual returns (bytes32) {
        return _groups[group].admin;
    }

    /**
     * @dev Get the group that acts as a guardian for a given group.
     *
     * The guardian permssion allows canceling actions that have been scheduled under the group.
     */
    function getGroupGuardian(bytes32 group) public view virtual returns (bytes32) {
        return _groups[group].guardian;
    }

    /**
     * @dev Get the access details for a given account in a given group. These details include the timepoint at which
     * membership becomes active, and the delay applied to all action by this user that require this permission level.
     */
    function getAccess(bytes32 group, address account) public view virtual returns (Access memory) {
        return _groups[group].members[account];
    }

    /**
     * @dev Check if a given account currently had the permission level corresponding to a given group. Note that this
     * permission might be associated with a delay. {getAccess} can provide more details.
     */
    function hasGroup(bytes32 group, address account) public view virtual returns (bool) {
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
    function grantRole(bytes32 group, address account, uint40 executionDelay) public virtual onlyGroup(getGroupAdmin(group)) {
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
    function revokeRole(bytes32 group, address account) public virtual onlyGroup(getGroupAdmin(group)) {
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
    function renounceRole(bytes32 group, address callerConfirmation) public virtual {
        require(callerConfirmation == _msgSender(), "AccessManager: can only renounce roles for self");
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
    function setExecuteDelay(bytes32 group, address account, uint40 newDelay) public virtual onlyGroup(getGroupAdmin(group)){
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
    function setGroupAdmin(bytes32 group, bytes32 admin) public virtual onlyGroup(ADMIN_GROUP) {
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
    function setGroupGuardian(bytes32 group, bytes32 guardian) public virtual onlyGroup(ADMIN_GROUP) {
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
    function setGrantDelay(bytes32 group, uint40 newDelay) public virtual onlyGroup(ADMIN_GROUP) {
        _setGrantDelay(group, newDelay.toDuration(), false);
    }

    /**
     * @dev Internal version of {grantRole} without access control.
     *
     * todo: emit an event
     */
    function _grantRole(bytes32 group, address account, Time.Duration grantDelay, Time.Duration executionDelay) internal virtual {
        require(!_groups[group].members[account].since.isSet(), "AccessManager: account is already in group");
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
    function _revokeRole(bytes32 group, address account) internal virtual {
        require(_groups[group].members[account].since.isSet(), "AccessManager: account is not in group");
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
    function _setExecuteDelay(bytes32 group, address account, Time.Duration newDuration, bool immediate) internal virtual {
        require(_groups[group].members[account].since.isSet(), "AccessManager: account is not in group");

        // here, we cannot use the "normal" `update` workflow because the delay is checked at execution and not
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
    function _setGroupAdmin(bytes32 group, bytes32 admin) internal virtual {
        _groups[group].admin = admin;
        // todo emit event
    }

    /**
     * @dev Internal version of {setGroupGuardian} without access control.
     *
     * todo: emit an event
     */
    function _setGroupGuardian(bytes32 group, bytes32 guardian) internal virtual {
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
    function _setGrantDelay(bytes32 group, Time.Duration newDelay, bool immediate) internal virtual {
        _groups[group].delay = immediate
            ? newDelay.toDelay()
            : _groups[group].delay.update(newDelay);
        // todo emit event
    }

    // ============================================= FUNCTION MANAGEMENT ==============================================
    function setFunctionAllowedGroup(
        address target,
        bytes4[] calldata selectors,
        bytes32 group
    ) public virtual onlyGroup(ADMIN_GROUP) {
        for (uint256 i = 0; i < selectors.length; ++i) {
            _setFunctionAllowedGroup(target, selectors[i], group);
        }
    }

    function _setFunctionAllowedGroup(address target, bytes4 selector, bytes32 group) internal virtual {
        _allowedGroups[target][selector] = group;
        // todo emit event
    }

    // =============================================== MODE MANAGEMENT ================================================
    function setContractModeCustom(address target) public virtual onlyGroup(ADMIN_GROUP) {
        _setContractMode(target, AccessMode.Custom);
    }

    function setContractModeOpen(address target) public virtual onlyGroup(ADMIN_GROUP) {
        _setContractMode(target, AccessMode.Open);
    }

    function setContractModeClosed(address target) public virtual onlyGroup(ADMIN_GROUP) {
        _setContractMode(target, AccessMode.Closed);
    }

    function _setContractMode(address target, AccessMode mode) internal virtual {
        _contractMode[target] = mode;
        // todo emit event
    }

    // ==================================================== OTHERS ====================================================
    function cancel(address caller, address target, bytes calldata data) public virtual {
        address msgsender = _msgSender();
        require(caller == msgsender && hasGroup(getGroupGuardian(getFunctionAllowedGroup(target, bytes4(data[0:4]))), msgsender), "unauthorised");
        _cancel(_hashOperation(caller, target, data));
    }

    function relay(address target, bytes calldata data) public payable virtual {
        address caller = _msgSender();
        Time.Duration setback = callDelay(caller, target, bytes4(data[0:4]));

        require(!Time.MAX_DURATION.eq(setback)); // unauthorized
        _executeCheck(_hashOperation(caller, target, data), setback);

        Address.functionCallWithValue(target, data, msg.value);
    }

    function updateAuthority(IManaged target, address newAuthority) public virtual onlyGroup(ADMIN_GROUP) {
        target.updateAuthority(newAuthority);
    }
}
