// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import "./IAuthority.sol";
import "./IManaged.sol";
import "../../utils/Address.sol";
import "../../utils/Context.sol";




library Delays {
    // Delay is 128 bits long, and packs the following:
    // [000:039] uint40 for the current value (duration)
    // [040:079] uint40 for the pending value (duration)
    // [080:127] uint48 for the effect date (timepoint)
    type Delay is uint128;

    function getAt(Delay self, uint48 clock) public pure returns (uint40 valueAt) {
        (uint40 pendingValue, uint48 timepoint) = getPending(self);
        return (timepoint > 0 && timepoint < clock)
            ? pendingValue
            : uint40(Delay.unwrap(self));
    }

    function get(Delay self) public view returns (uint40 value) {
        return getAt(self, uint48(block.timestamp));
    }

    function getPending(Delay self) public pure returns (uint40 pendingValue, uint48 timepoint) {
        uint128 pack = Delay.unwrap(self);
        return (uint40(pack >> 40), uint48(pack >> 80));
    }

    function set(uint40 delay) public pure returns (Delay) {
        return Delay.wrap(delay);
    }

    function updateAt(Delay self, uint40 newValue, uint48 clock) public view returns (Delay) {
        return Delay.wrap((uint128(clock) << 80) | (uint128(newValue) << 40) | get(self));
    }

    function update(Delay self, uint40 newValue) public view returns (Delay) {
        uint48 value = get(self);
        uint48 delay = value > newValue ? value - newValue : 0; // todo: 0 means immediate update. ACDAR does something more opinionated
        return updateAt(self, newValue, uint48(block.timestamp) + delay);
    }
}





contract DelayedActions is Context {
    mapping(bytes32 id => uint48 timepoint) private _schedules; // todo: add accessor

    event Scheduled(bytes32, address, address, bytes);
    event Executed(bytes32);

    modifier withDelay(uint48 delay) {
        _executeCheck(_msgSender(), address(this), _msgData(), delay);
        _;
    }

    function schedule(address target, bytes calldata data) public {
        _schedule(_msgSender(), target, data);
    }

    function _schedule(address caller, address target, bytes calldata data) internal virtual {
        bytes32 id = keccak256(abi.encode(caller, target, data));
        require(_schedules[id] == 0, "Already scheduled");
        _schedules[id] = uint48(block.timestamp);
        emit Scheduled(id, caller, target, data);
    }

    function _executeCheck(address caller, address target, bytes calldata data, uint48 delay) internal virtual {
        bytes32 id = keccak256(abi.encode(caller, target, data));
        uint48 timepoint = _schedules[id];
        require(timepoint > 0 || delay == 0, "missing schedule");
        require(timepoint + delay <= block.timestamp, "schedule pending");
        delete _schedules[id];
        emit Executed(id);
    }
}





contract AccessManager is IAuthority, DelayedActions {
    using Delays for Delays.Delay;

    enum AccessMode { Custom, Closed, Open }

    struct Access {
        uint48       since;
        Delays.Delay delay; // delay for execution
    }

    struct Group {
        mapping(address user => Access access) members;
        bytes32      admin;
        Delays.Delay delay; // delay for granting
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
        _grantRole(ADMIN_GROUP, initialAdmin, 0, 0);
    }

    // =================================================== GETTERS ====================================================
    // can call without a delay
    function canCall(address caller, address target, bytes4 selector) public view virtual returns (bool allowed) {
        return callDelay(caller, target, selector) == 0;
    }

    // delay to call a function
    function callDelay(address caller, address target, bytes4 selector) public view virtual returns (uint40 delay) {
        AccessMode mode = getContractMode(target);
        if (mode == AccessMode.Open) {
            return 0; // no delay = can call immediatly
        } else if (mode == AccessMode.Closed) {
            return type(uint40).max; // "infinite" delay
        } else if (caller == address(this)) {
            return 0;
        } else {
            bytes32 group = getFunctionAllowedGroup(target, selector);
            Access storage access = _groups[group].members[caller]; // todo: memory ?

            return (group == PUBLIC_GROUP || access.since < block.timestamp)
                ? access.delay.get()
                : type(uint40).max;
        }
    }

    function getContractMode(address target) public view virtual returns (AccessMode) {
        return _contractMode[target];
    }

    function getFunctionAllowedGroup(address target, bytes4 selector) public view virtual returns (bytes32) {
        return _allowedGroups[target][selector];
    }

    function getAccess(bytes32 group, address account) public view virtual returns (Access memory) {
        return _groups[group].members[account];
    }

    function hasGroup(bytes32 group, address account) public view returns (bool) {
        uint48 timepoint = getAccess(group, account).since;
        return timepoint > 0 && timepoint <= uint48(block.timestamp);
    }

    // =============================================== GROUP MANAGEMENT ===============================================
    function grantRole(bytes32 group, address account, uint40 executionDelay) public onlyGroup(_groups[group].admin) {
        _grantRole(group, account, _groups[group].delay.get(), executionDelay);
    }

    function revokeRole(bytes32 group, address account) public onlyGroup(_groups[group].admin) {
        _revokeRole(group, account);
    }

    function renounceRole(bytes32 group, address account) public {
        require(account == _msgSender(), "AccessManager: can only renounce roles for self");
        _revokeRole(group, _msgSender());
    }

    function setExecuteDelay(bytes32 group, address account, uint40 newDelay) public onlyGroup(ADMIN_GROUP){
        _setExecuteDelay(group, account, newDelay, false); // by default the update is not immediate and follows the delay rules
    }

    function setGrantDelay(bytes32 group, uint40 newDelay) public onlyGroup(ADMIN_GROUP) {
        _setGrantDelay(group, newDelay, false); // by default the update is not immediate and follows the delay rules
    }

    function _grantRole(bytes32 group, address account, uint40 grantDelay, uint40 executionDelay) internal {
        require(_groups[group].members[account].since == 0, "AccessManager: account is already in group");
        _groups[group].members[account] = Access({
            since: uint48(block.timestamp + grantDelay),
            delay: Delays.set(executionDelay)
        });
        // todo emit event
    }

    function _revokeRole(bytes32 group, address account) internal {
        require(_groups[group].members[account].since != 0, "AccessManager: account is not in group");
        delete _groups[group].members[account];
        // todo emit event
    }

    function _setExecuteDelay(bytes32 group, address account, uint40 newDelay, bool immediate) internal {
        _groups[group].members[account].delay = immediate
            ? Delays.set(newDelay)
            : _groups[group].members[account].delay.update(newDelay);
        // todo emit event
    }

    function _setGrantDelay(bytes32 group, uint40 newDelay, bool immediate) internal {
        _groups[group].delay = immediate
            ? Delays.set(newDelay)
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
    function relay(address target, bytes calldata data) public payable virtual {
        address caller = _msgSender();
        uint40  delay  = callDelay(caller, target, bytes4(data[0:4]));

        require(delay < type(uint40).max); // unauthorized
        _executeCheck(caller, target, data, delay);

        Address.functionCallWithValue(target, data, msg.value);
    }

    function updateAuthority(IManaged target, address newAuthority) public virtual onlyGroup(ADMIN_GROUP) {
        target.updateAuthority(newAuthority);
    }
}
