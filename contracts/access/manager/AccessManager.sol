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

    function grantGroup(uint8 group, address user, address[] calldata conditions) external;
    function revokeGroup(uint8 group, address user, address[] calldata conditions) external;
    function renounceGroup(uint8 group, address[] calldata conditions) external;
    function setFunctionAllowedGroup(address target, bytes4[] calldata selectors, uint8 group, bool allowed) external;
    function setContractModeCustom(address target) external;
    function setContractModeOpen(address target) external;
    function setContractModeClosed(address target) external;
    function getContractMode(address target) external view returns (AccessMode);
    function getFunctionAllowedGroups(address target, bytes4 selector) external view returns (bytes32);
    function getUserGroups(address user) external view returns (bytes32);
    function getUserGroups(address user, address[] calldata conditions) external view returns (bytes32);
}

import "hardhat/console.sol";

contract AccessManager is IAccessManager, AccessManagedImmutable(this) {
    using AccessManagerUtils for *;

    uint8 public constant MAX_CONDITION_DEPTH = 8; // Do we realistically need more ?
    uint8 public constant ADMIN_GROUP         = type(uint8).min;
    uint8 public constant PUBLIC_GROUP        = type(uint8).max;

    mapping(address user   => mapping(bytes32 conditions => bytes32    groups)) private _userGroups;
    mapping(address target => mapping(bytes4  selector   => bytes32    groups)) private _allowedGroups;
    mapping(address target =>                               AccessMode mode   ) private _contractMode;

    constructor(address initialAdmin) {
        _grantGroup(ADMIN_GROUP, initialAdmin, new address[](0));
        _setFunctionAllowedGroup(address(this), IAccessManager.grantGroup.selector,                 ADMIN_GROUP,  true);
        _setFunctionAllowedGroup(address(this), IAccessManager.revokeGroup.selector,                ADMIN_GROUP,  true);
        _setFunctionAllowedGroup(address(this), IAccessManager.renounceGroup.selector,              PUBLIC_GROUP, true);
        _setFunctionAllowedGroup(address(this), IAccessManager.setFunctionAllowedGroup.selector,    ADMIN_GROUP,  true);
        _setFunctionAllowedGroup(address(this), IAccessManager.setContractModeCustom.selector,      ADMIN_GROUP,  true);
        _setFunctionAllowedGroup(address(this), IAccessManager.setContractModeOpen.selector,        ADMIN_GROUP,  true);
        _setFunctionAllowedGroup(address(this), IAccessManager.setContractModeClosed.selector,      ADMIN_GROUP,  true);
    }

    // =============================================== GROUP MANAGEMENT ===============================================
    // Restricted to ADMIN_GROUP by default
    function grantGroup(uint8 group, address user, address[] calldata conditions) public virtual restricted() {
        _grantGroup(group, user, conditions);
    }

    // Restricted to ADMIN_GROUP by default
    function revokeGroup(uint8 group, address user, address[] calldata conditions) public virtual restricted() {
        _revokeGroup(group, user, conditions);
    }

    // Open to PUBLIC_GROUP by default
    function renounceGroup(uint8 group, address[] calldata conditions) public virtual restricted() {
        _revokeGroup(group, msg.sender, conditions);
    }

    function _grantGroup(uint8 group, address user, address[] memory conditions) internal virtual {
        bytes32 conditionsHash = _hashConditions(conditions);
        bytes32 before = _userGroups[user][conditionsHash];
        require(before & group.toMask() == 0, "Grant error: user already in group");
        _userGroups[user][conditionsHash] = before.applyMask(group.toMask(), true);
        // emit Event
    }

    function _revokeGroup(uint8 group, address user, address[] memory conditions) internal virtual {
        bytes32 conditionsHash = _hashConditions(conditions);
        bytes32 before = _userGroups[user][conditionsHash];
        require(before & group.toMask() != 0, "Revoke error: user not in group");
        _userGroups[user][conditionsHash] = before.applyMask(group.toMask(), false);
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

        // reserve the space for 32 iterations
        address[] memory conditionChain = new address[](MAX_CONDITION_DEPTH);
        assembly { mstore(conditionChain, 0) }

        for (uint256 i = 0; i < MAX_CONDITION_DEPTH; ++i) {
            // try getting the permission with the current permission array
            if (getUserGroups(caller, conditionChain) & allowedGroups > 0) return true;

            // assume "caller" is a condition
            address currentCaller = caller.callerFromCondition();

            // exit condition
            if (currentCaller == address(0)) break;

            // update the condition array
            assembly { mstore(conditionChain, add(i, 1)) }
            conditionChain[i] = caller;
            caller = currentCaller;
        }

        return false;
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
        return getUserGroups(user, new address[](0));
    }

    function getUserGroups(address user, address[] memory conditions) public view virtual returns (bytes32) {
        return _userGroups[user][_hashConditions(conditions)] | PUBLIC_GROUP.toMask();
    }

    function _hashConditions(address[] memory conditions) private pure returns (bytes32) {
        require(conditions.length < MAX_CONDITION_DEPTH, "Condition chain too deep");
        return keccak256(abi.encode(conditions));
    }
}
