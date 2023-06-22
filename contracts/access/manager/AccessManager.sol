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

    modifier withDelay(Time.Duration setback) {
        _executeCheck(_hashOperation(_msgSender(), address(this), _msgData()), setback);
        _;
    }

    function schedule(address target, bytes calldata data) public returns (bytes32) {
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
        Time.Timepoint timepoint = _schedules[id];
        require(timepoint.isSet() || setback.get() == 0, "missing schedule");
        require(timepoint.add(setback).isPast(), "schedule pending");
        _schedules[id] = 0.toTimepoint(); // delete
        emit Executed(id);
    }

    function _cancel(bytes32 id) internal virtual {
        require(_schedules[id].isSet(), "invalid schedule");
        _schedules[id] = 0.toTimepoint(); // delete
        emit Canceled(id);
    }

    function _hashOperation(address caller, address target, bytes calldata data) internal pure returns (bytes32) {
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
        _grantRole(ADMIN_GROUP, initialAdmin, 0.toDuration(), 0.toDuration());
    }

    // =================================================== GETTERS ====================================================
    // can call without a delay
    function canCall(address caller, address target, bytes4 selector) public view virtual returns (bool allowed) {
        return callDelay(caller, target, selector).get() == 0;
    }

    // delay to call a function
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

    function getContractMode(address target) public view virtual returns (AccessMode) {
        return _contractMode[target];
    }

    function getFunctionAllowedGroup(address target, bytes4 selector) public view virtual returns (bytes32) {
        return _allowedGroups[target][selector];
    }

    function getGroupAdmin(bytes32 group) public view virtual returns (bytes32) {
        return _groups[group].admin;
    }

    function getGroupGuardian(bytes32 group) public view virtual returns (bytes32) {
        return _groups[group].guardian;
    }

    function getAccess(bytes32 group, address account) public view virtual returns (Access memory) {
        return _groups[group].members[account];
    }

    function hasGroup(bytes32 group, address account) public view virtual returns (bool) {
        return getAccess(group, account).since.isSetAndPast();
    }

    // =============================================== GROUP MANAGEMENT ===============================================
    function grantRole(bytes32 group, address account, uint40 executionDelay) public virtual onlyGroup(getGroupAdmin(group)) {
        _grantRole(group, account, _groups[group].delay.get(), executionDelay.toDuration());
    }

    function revokeRole(bytes32 group, address account) public virtual onlyGroup(getGroupAdmin(group)) {
        _revokeRole(group, account);
    }

    function renounceRole(bytes32 group, address account) public virtual {
        require(account == _msgSender(), "AccessManager: can only renounce roles for self");
        _revokeRole(group, _msgSender());
    }

    function setExecuteDelay(bytes32 group, address account, uint40 newDelay) public virtual onlyGroup(ADMIN_GROUP){
        _setExecuteDelay(group, account, newDelay.toDuration(), false); // by default the update is not immediate and follows the delay rules
    }

    function setGroupAdmin(bytes32 group, bytes32 admin) public virtual onlyGroup(ADMIN_GROUP) {
        _setGroupAdmin(group, admin);
    }

    function setGroupGuardian(bytes32 group, bytes32 guardian) public virtual onlyGroup(ADMIN_GROUP) {
        _setGroupGuardian(group, guardian);
    }

    function setGrantDelay(bytes32 group, uint40 newDelay) public virtual onlyGroup(ADMIN_GROUP) {
        _setGrantDelay(group, newDelay.toDuration(), false); // by default the update is not immediate and follows the delay rules
    }

    function _grantRole(bytes32 group, address account, Time.Duration grantDelay, Time.Duration executionDelay) internal virtual {
        require(!_groups[group].members[account].since.isSet(), "AccessManager: account is already in group");
        _groups[group].members[account] = Access({
            since: Time.clock().add(grantDelay),
            delay: executionDelay.toDelay()
        });
        // todo emit event
    }

    function _revokeRole(bytes32 group, address account) internal virtual {
        require(_groups[group].members[account].since.isSet(), "AccessManager: account is not in group");
        delete _groups[group].members[account];
        // todo emit event
    }

    function _setExecuteDelay(bytes32 group, address account, Time.Duration newDelay, bool immediate) internal virtual {
        _groups[group].members[account].delay = immediate
            ? newDelay.toDelay()
            : _groups[group].members[account].delay.update(newDelay);
        // todo emit event
    }

    function _setGroupAdmin(bytes32 group, bytes32 admin) internal virtual {
        _groups[group].admin = admin;
        // todo emit event
    }

    function _setGroupGuardian(bytes32 group, bytes32 guardian) internal virtual {
        _groups[group].guardian = guardian;
        // todo emit event
    }

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

    function _setFunctionAllowedGroup(address target, bytes4 selector, bytes32 group) internal {
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
    function adminCancel(address caller, address target, bytes calldata data) public virtual
        onlyGroup(getGroupGuardian(getFunctionAllowedGroup(target, bytes4(data[0:4]))))
    {
        _cancel(_hashOperation(caller, target, data));
    }

    function cancel(address target, bytes calldata data) public virtual {
        _cancel(_hashOperation(_msgSender(), target, data));
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
