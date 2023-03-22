// SPDX-License-Identifier: MIT

pragma solidity ^0.8.18;

import "../AccessControl.sol";
import "../AccessControlDefaultAdminRules.sol";
import "./IAuthority.sol";
import "./AccessManaged.sol";

interface IAccessManager is IAuthority {
    enum RestrictedMode {
        Custom,
        Closed,
        Open
    }

    event GroupUpdated(uint8 indexed group, string name);

    event GroupAllowed(address indexed target, bytes4 indexed selector, uint8 indexed group, bool allowed);

    event RestrictedModeUpdated(address indexed target, RestrictedMode indexed mode);

    function createGroup(uint8 group, string calldata name) external;

    function updateGroupName(uint8 group, string calldata name) external;

    function hasGroup(uint8 group) external view returns (bool);

    function getUserGroups(address user) external view returns (bytes32 groups);

    function grantGroup(address user, uint8 group) external;

    function revokeGroup(address user, uint8 group) external;

    function renounceGroup(address user, uint8 group) external;

    function getFunctionAllowedGroups(address target, bytes4 selector) external view returns (bytes32 groups);

    function setFunctionAllowedGroup(address target, bytes4[] calldata selectors, uint8 group, bool allowed) external;

    function getContractMode(address target) external view returns (RestrictedMode);

    function setContractModeCustom(address target) external;

    function setContractModeOpen(address target) external;

    function setContractModeClosed(address target) external;

    function transferContractAuthority(address target, address newAuthority) external;
}

/**
 * @dev AccessManager is a central contract to store the permissions of a system.
 *
 * The smart contracts under the control of an AccessManager instance will have a set of "restricted" functions, and the
 * exact details of how access is restricted for each of those functions is configurable by the admins of the instance.
 * These restrictions are expressed in terms of "groups".
 *
 * An AccessManager instance will define a set of groups. Each of them must be created before they can be granted, with
 * a maximum of 255 created groups. Users can be added into any number of these groups. Each of them defines an
 * AccessControl role, and may confer access to some of the restricted functions in the system, as configured by admins
 * through the use of {setFunctionAllowedGroup}.
 *
 * Note that a function in a target contract may become permissioned in this way only when: 1) said contract is
 * {AccessManaged} and is connected to this contract as its manager, and 2) said function is decorated with the
 * `restricted` modifier.
 *
 * There is a special group defined by default named "public" which all accounts automatically have.
 *
 * Contracts can also be configured in two special modes: 1) the "open" mode, where all functions are allowed to the
 * "public" group, and 2) the "closed" mode, where no function is allowed to any group.
 *
 * Since all the permissions of the managed system can be modified by the admins of this instance, it is expected that
 * it will be highly secured (e.g., a multisig or a well-configured DAO). Additionally, {AccessControlDefaultAdminRules}
 * is included to enforce security rules on this account.
 *
 * NOTE: Some of the functions in this contract, such as {getUserGroups}, return a `bytes32` bitmap to succintly
 * represent a set of groups. In a bitmap, bit `n` (counting from the least significant bit) will be 1 if and only if
 * the group with number `n` is in the set. For example, the hex value `0x05` represents the set of the two groups
 * numbered 0 and 2 from its binary equivalence `0b101`
 */
contract AccessManager is IAccessManager, AccessControlDefaultAdminRules {
    bytes32 _createdGroups;

    // user -> groups
    mapping(address => bytes32) private _userGroups;

    // target -> selector -> groups
    mapping(address => mapping(bytes4 => bytes32)) private _allowedGroups;

    // target -> mode
    mapping(address => RestrictedMode) private _contractMode;

    uint8 private constant _GROUP_PUBLIC = 255;

    /**
     * @dev Initializes an AccessManager with initial default admin and transfer delay.
     */
    constructor(
        uint48 initialDefaultAdminDelay,
        address initialDefaultAdmin
    ) AccessControlDefaultAdminRules(initialDefaultAdminDelay, initialDefaultAdmin) {
        _createGroup(_GROUP_PUBLIC, "public");
    }

    /**
     * @dev Returns true if the caller can invoke on a target the function identified by a function selector.
     * Entrypoint for {AccessManaged} contracts.
     */
    function canCall(address caller, address target, bytes4 selector) public view returns (bool) {
        bytes32 allowedGroups = getFunctionAllowedGroups(target, selector);
        bytes32 callerGroups = getUserGroups(caller);
        return callerGroups & allowedGroups != 0;
    }

    /**
     * @dev Creates a new group with a group number that can be chosen arbitrarily but must be unused, and gives it a
     * human-readable name. The caller must be the default admin.
     *
     * Group numbers are not auto-incremented in order to avoid race conditions, but administrators can safely use
     * sequential numbers.
     *
     * Emits {GroupUpdated}.
     */
    function createGroup(uint8 group, string memory name) public virtual onlyDefaultAdmin {
        _createGroup(group, name);
    }

    /**
     * @dev Updates an existing group's name. The caller must be the default admin.
     */
    function updateGroupName(uint8 group, string memory name) public virtual onlyDefaultAdmin {
        require(group != _GROUP_PUBLIC, "AccessManager: built-in group");
        require(hasGroup(group), "AccessManager: unknown group");
        emit GroupUpdated(group, name);
    }

    /**
     * @dev Returns true if the group has already been created via {createGroup}.
     */
    function hasGroup(uint8 group) public view virtual returns (bool) {
        return _getGroup(_createdGroups, group);
    }

    /**
     * @dev Returns a bitmap of the groups the user has. See note on bitmaps above.
     */
    function getUserGroups(address user) public view virtual returns (bytes32) {
        return _userGroups[user] | _groupMask(_GROUP_PUBLIC);
    }

    /**
     * @dev Grants a user a group.
     *
     * Emits {RoleGranted} with the role id of the group, if wasn't already held by the user.
     */
    function grantGroup(address user, uint8 group) public virtual {
        grantRole(_encodeGroupRole(group), user); // will check msg.sender
    }

    /**
     * @dev Removes a group from a user.
     *
     * Emits {RoleRevoked} with the role id of the group, if previously held by the user.
     */
    function revokeGroup(address user, uint8 group) public virtual {
        revokeRole(_encodeGroupRole(group), user); // will check msg.sender
    }

    /**
     * @dev Allows a user to renounce a group.
     *
     * Emits {RoleRevoked} with the role id of the group, if previously held by the user.
     */
    function renounceGroup(address user, uint8 group) public virtual {
        renounceRole(_encodeGroupRole(group), user); // will check msg.sender
    }

    /**
     * @dev Returns a bitmap of the groups that are allowed to call a function of a target contract. If the target
     * contract is in open or closed mode it will be reflected in the return value.
     */
    function getFunctionAllowedGroups(address target, bytes4 selector) public view virtual returns (bytes32) {
        RestrictedMode mode = getContractMode(target);
        if (mode == RestrictedMode.Open) {
            return _groupMask(_GROUP_PUBLIC);
        } else if (mode == RestrictedMode.Closed) {
            return 0;
        } else {
            return _allowedGroups[target][selector];
        }
    }

    /**
     * @dev Changes whether a group is allowed to call a function of a contract, according to the `allowed` argument.
     * The caller must be the default admin.
     */
    function setFunctionAllowedGroup(
        address target,
        bytes4[] calldata selectors,
        uint8 group,
        bool allowed
    ) public virtual onlyDefaultAdmin {
        require(_contractMode[target] == RestrictedMode.Custom, "AccessManager: target in special mode");
        for (uint256 i = 0; i < selectors.length; i++) {
            bytes4 selector = selectors[i];
            _allowedGroups[target][selector] = _withUpdatedGroup(_allowedGroups[target][selector], group, allowed);
            emit GroupAllowed(target, selector, group, allowed);
        }
    }

    /**
     * @dev Returns the mode of the target contract, which may be custom (`0`), closed (`1`), or open (`2`).
     */
    function getContractMode(address target) public view virtual returns (RestrictedMode) {
        return _contractMode[target];
    }

    /**
     * @dev Sets the target contract to be in custom restricted mode. All restricted functions in the target contract
     * will follow the group-based restrictions defined by the AccessManager. The caller must be the default admin.
     */
    function setContractModeCustom(address target) public virtual onlyDefaultAdmin {
        _contractMode[target] = RestrictedMode.Custom;
        emit RestrictedModeUpdated(target, RestrictedMode.Custom);
    }

    /**
     * @dev Sets the target contract to be in "open" mode. All restricted functions in the target contract will become
     * callable by anyone. The caller must be the default admin.
     */
    function setContractModeOpen(address target) public virtual onlyDefaultAdmin {
        _contractMode[target] = RestrictedMode.Open;
        emit RestrictedModeUpdated(target, RestrictedMode.Open);
    }

    /**
     * @dev Sets the target contract to be in "closed" mode. All restricted functions in the target contract will be
     * closed down and disallowed to all. The caller must be the default admin.
     */
    function setContractModeClosed(address target) public virtual onlyDefaultAdmin {
        _contractMode[target] = RestrictedMode.Closed;
        emit RestrictedModeUpdated(target, RestrictedMode.Closed);
    }

    /**
     * @dev Transfers a target contract onto a new authority. The caller must be the default admin.
     */
    function transferContractAuthority(address target, address newAuthority) public virtual onlyDefaultAdmin {
        AccessManaged(target).setAuthority(IAuthority(newAuthority));
    }

    /**
     * @dev Creates a new group.
     *
     * Emits {GroupUpdated}.
     */
    function _createGroup(uint8 group, string memory name) internal virtual {
        require(!hasGroup(group), "AccessManager: existing group");
        _createdGroups = _withUpdatedGroup(_createdGroups, group, true);
        emit GroupUpdated(group, name);
    }

    /**
     * @dev Augmented version of {AccessControl-_grantRole} that keeps track of user group bitmaps.
     */
    function _grantRole(bytes32 role, address user) internal virtual override {
        super._grantRole(role, user);
        (bool isGroup, uint8 group) = _decodeGroupRole(role);
        if (isGroup) {
            require(hasGroup(group), "AccessManager: unknown group");
            _userGroups[user] = _withUpdatedGroup(_userGroups[user], group, true);
        }
    }

    /**
     * @dev Augmented version of {AccessControl-_revokeRole} that keeps track of user group bitmaps.
     */
    function _revokeRole(bytes32 role, address user) internal virtual override {
        super._revokeRole(role, user);
        (bool isGroup, uint8 group) = _decodeGroupRole(role);
        if (isGroup) {
            require(hasGroup(group), "AccessManager: unknown group");
            require(group != _GROUP_PUBLIC, "AccessManager: irrevocable group");
            _userGroups[user] = _withUpdatedGroup(_userGroups[user], group, false);
        }
    }

    /**
     * @dev Returns the {AccessControl} role id that corresponds to a group.
     *
     * This role id starts with the ASCII characters `group:`, followed by zeroes, and ends with the single byte
     * corresponding to the group number.
     */
    function _encodeGroupRole(uint8 group) internal pure virtual returns (bytes32) {
        return bytes32("group:") | bytes32(uint256(group));
    }

    /**
     * @dev Decodes a role id into a group, if it is a role id of the kind returned by {_encodeGroupRole}.
     */
    function _decodeGroupRole(bytes32 role) internal pure virtual returns (bool, uint8) {
        bytes32 tagMask = ~bytes32(uint256(0xff));
        bytes32 tag = role & tagMask;
        uint8 group = uint8(role[31]);
        return (tag == bytes32("group:"), group);
    }

    /**
     * @dev Returns a bit mask where the only non-zero bit is the group number bit.
     */
    function _groupMask(uint8 group) private pure returns (bytes32) {
        return bytes32(1 << group);
    }

    /**
     * @dev Returns the value of the group number bit in a bitmap.
     */
    function _getGroup(bytes32 bitmap, uint8 group) private pure returns (bool) {
        return bitmap & _groupMask(group) > 0;
    }

    /**
     * @dev Returns a new group bitmap where a specific group was updated.
     */
    function _withUpdatedGroup(bytes32 bitmap, uint8 group, bool value) private pure returns (bytes32) {
        bytes32 mask = _groupMask(group);
        if (value) {
            return bitmap | mask;
        } else {
            return bitmap & ~mask;
        }
    }
}
