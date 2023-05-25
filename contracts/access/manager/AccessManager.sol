// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import "./AccessManagerUtils.sol";
import "./IAuthority.sol";
import "./ICondition.sol";
import "./AccessManaged.sol";

interface IAccessManager is IAuthority {
    enum AccessMode { Custom, Closed, Open }

    event GroupAllowed(address indexed target, bytes4 indexed selector, uint8 indexed group, bool allowed);
    event AccessModeUpdated(address indexed target, AccessMode previousMode, AccessMode indexed mode);

    function grantGroup(uint8 group, address user) external;
    function revokeGroup(uint8 group, address user) external;
    function renounceGroup(uint8 group) external;
    function grantGroupWithCondition(uint8 group, address user, address condition) external;
    function revokeGroupWithCondition(uint8 group, address user, address condition) external;
    function renounceGroupWithCondition(uint8 group, address condition) external;
    function setFunctionAllowedGroup(address target, bytes4[] calldata selectors, uint8 group, bool allowed) external;
    function setContractModeCustom(address target) external;
    function setContractModeOpen(address target) external;
    function setContractModeClosed(address target) external;
    function getContractMode(address target) external view returns (AccessMode);
    function getFunctionAllowedGroups(address target, bytes4 selector) external view returns (bytes32);
    function getUserGroups(address user) external view returns (bytes32);
    function getUserConditionedGroups(address user, address condition) external view returns (bytes32);
}

contract AccessManager is IAccessManager, AccessManagedImmutable(this) {
    using AccessManagerUtils for *;

    uint8 public constant ADMIN_GROUP  = type(uint8).min;
    uint8 public constant PUBLIC_GROUP = type(uint8).max;

    mapping(address user   =>                              bytes32    groups ) private _userGroups;
    mapping(address user   => mapping(address condition => bytes32    groups)) private _userConditionedGroups;
    mapping(address target => mapping(bytes4  selector  => bytes32    groups)) private _allowedGroups;
    mapping(address target =>                              AccessMode mode   ) private _contractMode;

    constructor(address initialAdmin) {
        _grantGroup(ADMIN_GROUP, initialAdmin);
        _setFunctionAllowedGroup(address(this), IAccessManager.grantGroup.selector,                 ADMIN_GROUP,  true);
        _setFunctionAllowedGroup(address(this), IAccessManager.revokeGroup.selector,                ADMIN_GROUP,  true);
        _setFunctionAllowedGroup(address(this), IAccessManager.renounceGroup.selector,              PUBLIC_GROUP, true);
        _setFunctionAllowedGroup(address(this), IAccessManager.grantGroupWithCondition.selector,    ADMIN_GROUP,  true);
        _setFunctionAllowedGroup(address(this), IAccessManager.revokeGroupWithCondition.selector,   ADMIN_GROUP,  true);
        _setFunctionAllowedGroup(address(this), IAccessManager.renounceGroupWithCondition.selector, PUBLIC_GROUP, true);
        _setFunctionAllowedGroup(address(this), IAccessManager.setFunctionAllowedGroup.selector,    ADMIN_GROUP,  true);
        _setFunctionAllowedGroup(address(this), IAccessManager.setContractModeCustom.selector,      ADMIN_GROUP,  true);
        _setFunctionAllowedGroup(address(this), IAccessManager.setContractModeOpen.selector,        ADMIN_GROUP,  true);
        _setFunctionAllowedGroup(address(this), IAccessManager.setContractModeClosed.selector,      ADMIN_GROUP,  true);
    }

    // =============================================== GROUP MANAGEMENT ===============================================
    // Restricted to ADMIN_GROUP by default
    function grantGroup(uint8 group, address user) public virtual restricted() {
        _grantGroup(group, user);
    }

    // Restricted to ADMIN_GROUP by default
    function revokeGroup(uint8 group, address user) public virtual restricted() {
        _revokeGroup(group, user);
    }

    // Open to PUBLIC_GROUP by default
    function renounceGroup(uint8 group) public virtual restricted() {
        _revokeGroup(group, msg.sender);
    }

    function _grantGroup(uint8 group, address user) internal virtual {
        bytes32 before = _userGroups[user];
        require(before & group.toMask() == 0, "Grant error: user already in group");
        _userGroups[user] = before.applyMask(group.toMask(), true);
        // emit Event
    }

    function _revokeGroup(uint8 group, address user) internal virtual {
        bytes32 before = _userGroups[user];
        require(before & group.toMask() != 0, "Revoke error: user not in group");
        _userGroups[user] = before.applyMask(group.toMask(), false);
        // emit Event
    }

    // ============================================= CONDITION MANAGEMENT =============================================
    function grantGroupWithCondition(uint8 group, address user, address condition) public virtual restricted() {
        _grantGroupWithCondition(group, user, condition);
    }

    function revokeGroupWithCondition(uint8 group, address user, address condition) public virtual restricted() {
        _revokeGroupWithCondition(group, user, condition);
    }

    function renounceGroupWithCondition(uint8 group, address condition) public virtual restricted() {
        _revokeGroupWithCondition(group, msg.sender, condition);
    }

    function _grantGroupWithCondition(uint8 group, address user, address condition) internal {
        bytes32 before = _userConditionedGroups[user][condition];
        require(before & group.toMask() == 0, "Grant error: user already in group with condition");
        _userConditionedGroups[user][condition] = before.applyMask(group.toMask(), true);
        // emit Event
    }

    function _revokeGroupWithCondition(uint8 group, address user, address condition) internal {
        bytes32 before = _userConditionedGroups[user][condition];
        require(before & group.toMask() == 0, "Grant error: user already in group with condition");
        _userConditionedGroups[user][condition] = before.applyMask(group.toMask(), true);
        // emit Event
    }

    // ============================================= FUNCTION MANAGEMENT ==============================================
    function setFunctionAllowedGroup(
        address target,
        bytes4[] calldata selectors,
        uint8 group,
        bool allowed
    ) public virtual restricted() {
        for (uint256 i = 0; i < selectors.length; ++i) {
            _setFunctionAllowedGroup(target, selectors[i], group, allowed);
        }
    }

    function _setFunctionAllowedGroup(address target, bytes4 selector, uint8 group, bool allowed) internal {
        _allowedGroups[target][selector] = _allowedGroups[target][selector].applyMask(group.toMask(), allowed);
        emit GroupAllowed(target, selector, group, allowed);
    }

    // =============================================== MODE MANAGEMENT ================================================
    function setContractModeCustom(address target) public virtual restricted() {
        _setContractMode(target, AccessMode.Custom);
    }

    function setContractModeOpen(address target) public virtual restricted() {
        _setContractMode(target, AccessMode.Open);
    }

    function setContractModeClosed(address target) public virtual restricted() {
        _setContractMode(target, AccessMode.Closed);
    }

    function _setContractMode(address target, AccessMode mode) internal virtual {
        AccessMode previousMode = _contractMode[target];
        _contractMode[target] = mode;
        emit AccessModeUpdated(target, previousMode, mode);
    }

    // =================================================== GETTERS ====================================================
    function canCall(address caller, address target, bytes4 selector) public view virtual returns (bool) {
        bytes32 allowedGroups = getFunctionAllowedGroups(target, selector);
        if (getUserGroups(caller) & allowedGroups != 0) {
            return true;
        }

        // assume caller is a condition, recover the real caller (user) from it.
        address user = caller.callerFromCondition();
        return user != address(0) && getUserConditionedGroups(user, caller) & allowedGroups != 0;
    }

    function getContractMode(address target) public view virtual returns (AccessMode) {
        return _contractMode[target];
    }

    function getFunctionAllowedGroups(address target, bytes4 selector) public view virtual returns (bytes32) {
        AccessMode mode = getContractMode(target);
        if (mode == AccessMode.Open) {
            return PUBLIC_GROUP.toMask();
        } else if (mode == AccessMode.Closed) {
            return bytes32(0);
        } else {
            return _allowedGroups[target][selector];
        }
    }

    function getUserGroups(address user) public view virtual returns (bytes32) {
        return _userGroups[user] | PUBLIC_GROUP.toMask();
    }

    function getUserConditionedGroups(address user, address condition) public view virtual returns (bytes32) {
        return _userConditionedGroups[user][condition] | PUBLIC_GROUP.toMask(); // the "or" part is actually not needed
    }
}