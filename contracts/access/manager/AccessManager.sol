// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import "./IAuthority.sol";
import "../../utils/Address.sol";
import "../../utils/Context.sol";






interface IAccessManager is IAuthority {
//     event GroupAllowed(address indexed target, bytes4 indexed selector, uint8 indexed group, bool allowed);
//     event AccessModeUpdated(address indexed target, AccessMode previousMode, AccessMode indexed mode);

//     function grantGroup(address user, bytes32 group, address[] calldata conditions) external;
//     function revokeGroup(uint8 group, address user, address[] calldata conditions) external;
//     function renounceGroup(uint8 group, address[] calldata conditions) external;
//     function setFunctionAllowedGroup(address target, bytes4[] calldata selectors, uint8 group, bool allowed) external;
//     function setContractModeCustom(address target) external;
//     function setContractModeOpen(address target) external;
//     function setContractModeClosed(address target) external;
//     function getContractMode(address target) external view returns (AccessMode);
//     function getFunctionAllowedGroups(address target, bytes4 selector) external view returns (bytes32);
//     function getUserGroups(address user) external view returns (bytes32);
//     function getUserGroups(address user, address[] calldata conditions) external view returns (bytes32);
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
    enum AccessMode { Custom, Closed, Open }

    struct Group {
        mapping(address user => uint48 timepoint) members;
        bytes32 admin;
        uint48 grantDelay;
    }

    bytes32 public constant ADMIN_GROUP  = bytes32(type(uint256).min); // 0
    bytes32 public constant PUBLIC_GROUP = bytes32(type(uint256).max); // 2**256-1

    address private _currentCaller = address(0xdead);
    mapping(address target => AccessMode mode) private _contractMode;
    mapping(address target => mapping(bytes4 selector => bytes32 group)) private _allowedGroups;
    mapping(bytes32 group => Group) private _groups;

    constructor(address initialAdmin) {
        _grantRole(ADMIN_GROUP, initialAdmin, uint48(block.timestamp));
    }

    function relay(address target, bytes calldata data) public payable virtual {
        address caller = _msgSender();

        // check operation was scheduled (or is authorized with no delay)
        _executeCheck(caller, target, data, 1 minutes); // todo: delay ???

        // todo: restrict to external target? target using address(this) as an authority?
        address previousCurrentCaller = _currentCaller;
        _currentCaller = caller;
        Address.functionCallWithValue(target, data, msg.value);
        _currentCaller = previousCurrentCaller;
    }

    // =================================================== GETTERS ====================================================
    function canCall(address caller, address target, bytes4 selector) public view virtual returns (bool allowed) {
        AccessMode mode = getContractMode(target);
        if (mode == AccessMode.Open) {
            return true;
        } else if (mode == AccessMode.Closed) {
            return false;
        } else { // mode == AccessMode.Custom

            // TODO: delay forced ?
            // If yes, caller must be address(this): relayed call
            // If no, accept direct access (caller is user)

            bytes32 group = getFunctionAllowedGroup(target, selector);
            return
                group == PUBLIC_GROUP ||
                hasGroup(group, caller == address(this) ? currentCaller() : caller);
        }
    }

    function currentCaller() public view virtual returns (address) {
        return _currentCaller;
    }

    function getContractMode(address target) public view virtual returns (AccessMode) {
        return _contractMode[target];
    }

    function getFunctionAllowedGroup(address target, bytes4 selector) public view virtual returns (bytes32) {
        return _allowedGroups[target][selector];
    }

    // =============================================== GROUP MANAGEMENT ===============================================
    modifier onlyGroup(bytes32 group) {
        require(hasGroup(group, _msgSender()));
        _;
    }

    function hasGroup(bytes32 group, address account) public view returns (bool) {
        uint48 timepoint = _groups[group].members[account];
        return timepoint > 0 && timepoint <= uint48(block.timestamp);
    }

    function grantRole(bytes32 group, address account) public onlyGroup(_groups[group].admin) {
        _grantRole(group, account, _groups[group].grantDelay);
    }

    function revokeRole(bytes32 group, address account) public onlyGroup(_groups[group].admin) {
        _revokeRole(group, account);
    }

    function renounceRole(bytes32 group, address account) public {
        require(account == _msgSender(), "AccessManager: can only renounce roles for self");
        _revokeRole(group, _msgSender());
    }

    function setGrantDelay(bytes32 group, uint48 newDelay) public onlyGroup(ADMIN_GROUP) withDelay(_groups[group].grantDelay) {
        _setGrantDelay(group, newDelay);
    }

    function _grantRole(bytes32 group, address account, uint48 when) internal {
        require(_groups[group].members[account] == 0, "AccessManager: account is already in group");
        _groups[group].members[account] = uint48(block.timestamp) + when;
        // todo emit event
    }

    function _revokeRole(bytes32 group, address account) internal {
        require(_groups[group].members[account] != 0, "AccessManager: account is not in group");
        delete _groups[group].members[account];
        // todo emit event
    }

    function _setGrantDelay(bytes32 group, uint48 newDelay) internal {
        _groups[group].grantDelay = newDelay;
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
}
