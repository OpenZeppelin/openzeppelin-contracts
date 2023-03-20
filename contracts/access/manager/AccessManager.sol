// SPDX-License-Identifier: MIT

pragma solidity ^0.8.18;

import "../AccessControl.sol";
import "../AccessControlDefaultAdminRules.sol";
import "./IAuthority.sol";

interface IAccessManager is IAuthority {
    event BadgeUpdated(uint8 indexed badge, string name);

    event BadgeAllowed(bytes32 indexed group, bytes4 indexed selector, uint8 indexed badge, bool allowed);

    event ContractGroupUpdated(address indexed target, bytes32 indexed group);

    function createBadge(uint8 badge, string calldata name) external;

    function updateBadgeName(uint8 badge, string calldata name) external;

    function hasBadge(uint8 badge) external view returns (bool);

    function getUserBadges(address user) external view returns (bytes32 badges);

    function grantBadge(address user, uint8 badge) external;

    function revokeBadge(address user, uint8 badge) external;

    function renounceBadge(address user, uint8 badge) external;

    function getFunctionAllowedBadges(address target, bytes4 selector) external view returns (bytes32 badges);
    function getFunctionAllowedBadges(string calldata group, bytes4 selector) external view returns (bytes32 badges);

    function setFunctionAllowedBadge(address target, bytes4[] calldata selectors, uint8 badge, bool allowed) external;
    function setFunctionAllowedBadge(string calldata group, bytes4[] calldata selectors, uint8 badge, bool allowed) external;

    function getContractGroup(address target) external view returns (bytes32);

    function setContractGroup(address target, string calldata groupName) external;

    function setContractOpen(address target) external;

    function setContractClosed(address target) external;

    // TODO: Ability to eject a contract. See AccessManaged.setAuthority
    // function transferContractAuthority(address target, address newAuthority) external;
}

/**
 * @dev AccessManager is a central contract that stores the permissions of a system. It is an AccessControl contract,
 * i.e. it has roles and all the standard functions like `grantRole` and `revokeRole`, but it defines a particular set
 * of roles, with a particular structure.
 *
 * Users are granted "badges". Badges must be created before they can be granted, with a maximum of 255 created badges.
 * A user can be granted multiple badges. Each badge defines an AccessControl role, identified by a role id that starts
 * with the ASCII characters `badge:`, followed by zeroes, and ending with the single byte corresponding to the badge
 * number.
 *
 * Contracts in the system may be grouped as well. These are simply called "contract groups". There can be an arbitrary
 * number of groups. Each contract can only be in one group at a time. In the simplest setup, each contract is assigned
 * to its own separate group, but groups can also be shared among similar contracts.
 *
 * All contracts in a group share the same permissioning scheme. A permissioning scheme consists of a mapping between
 * functions and allowed badges. Each function can be allowed to multiple badges, meaning that if a user has at least
 * one of the allowed badges they can call that function.
 *
 * Note that a function in a target contract may become permissioned only when: 1) said contract is {AccessManaged} and
 * is connected to this contract as its manager, and 2) said function is decorated with the `restricted` modifier.
 *
 * There is a special badge defined by default named "public" which all accounts automatically have, and two special
 * contract groups: 1) the "open" group, where all functions are allowed to the "public" badge, and 2) the "closed"
 * group, where no function is allowed to any badge.
 *
 * Permissioning schemes and badge and contract group assignments can be configured by the default admin. The contract
 * includes {AccessControlDefaultAdminRules} by default to enforce security rules on this account. Additionally, it is
 * expected that the account will be highly secured (e.g., a multisig or a well-configured DAO) as all the permissions
 * of the managed system can be modified by it.
 *
 * NOTE: Some of the functions in this contract, such as {getUserBadges}, return a `bytes32` bitmap to succintly
 * represent a set of badges. In a bitmap, bit `n` (counting from the least significant bit) will be 1 if and only if
 * the badge with number `n` is in the set.
 */
contract AccessManager is IAccessManager, AccessControlDefaultAdminRules {
    bytes32 _createdBadges;
    mapping(address user => bytes32 badges) private _userBadges;
    mapping(bytes32 group => mapping(bytes4 selector => bytes32 badges)) private _allowedBadges;
    mapping(address target => bytes32 group) private _contractGroup;

    uint8 private constant _BADGE_PUBLIC = 255;

    bytes32 private constant _GROUP_UNSET = 0;
    bytes32 private constant _GROUP_OPEN = "group:open";
    bytes32 private constant _GROUP_CLOSED = "group:closed";

    bytes14 private constant _GROUP_SOLO_PREFIX = "group:solo:";
    bytes13 private constant _GROUP_CUSTOM_PREFIX = "group:custom:";

    /**
     * @dev Initializes an AccessManager with initial default admin and transfer delay.
     */
    constructor(
        uint48 initialDefaultAdminDelay,
        address initialDefaultAdmin
    ) AccessControlDefaultAdminRules(initialDefaultAdminDelay, initialDefaultAdmin) {
        _createBadge(_BADGE_PUBLIC, "public");
    }

    /**
     * @dev Returns true if the caller can invoke on a target the function identified by a function selector.
     * Entrypoint for {AccessManaged} contracts.
     */
    function canCall(address caller, address target, bytes4 selector) public view returns (bool) {
        bytes32 allowedBadges = getFunctionAllowedBadges(target, selector);
        bytes32 callerBadges = getUserBadges(caller);
        return callerBadges & allowedBadges != 0;
    }

    /**
     * @dev Creates a new badge with a badge number that can be chosen arbitrarily but must be unused, and gives it a
     * human-readable name. The caller must be the default admin.
     *
     * Badge numbers are not auto-incremented in order to avoid race conditions, but administrators can safely use
     * sequential numbers.
     *
     * Emits {BadgeUpdated}.
     */
    function createBadge(uint8 badge, string memory name) public virtual onlyDefaultAdmin {
        _createBadge(badge, name);
    }

    /**
     * @dev Updates an existing badge's name. The caller must be the default admin.
     */
    function updateBadgeName(uint8 badge, string memory name) public virtual onlyDefaultAdmin {
        require(badge != _BADGE_PUBLIC && hasBadge(badge));
        emit BadgeUpdated(badge, name);
    }

    /**
     * @dev Returns true if the badge has already been created via {createBadge}.
     */
    function hasBadge(uint8 badge) public virtual view returns (bool) {
        return _getBadge(_createdBadges, badge);
    }

    /**
     * @dev Returns a bitmap of the badges the user has. See note on bitmaps above.
     */
    function getUserBadges(address user) public view virtual returns (bytes32) {
        return _userBadges[user] | _badgeMask(_BADGE_PUBLIC);
    }

    /**
     * @dev Grants a user a badge.
     *
     * Emits {RoleGranted} with the role id of the badge, if wasn't already held by the user.
     */
    function grantBadge(address user, uint8 badge) public virtual {
        // grantRole checks that msg.sender is admin for the role
        grantRole(_encodeBadgeRole(badge), user);
    }

    /**
     * @dev Removes a badge from a user.
     *
     * Emits {RoleRevoked} with the role id of the badge, if previously held by the user.
     */
    function revokeBadge(address user, uint8 badge) public virtual {
        // revokeRole checks that msg.sender is admin for the role
        revokeRole(_encodeBadgeRole(badge), user);
    }

    /**
     * @dev Allows a user to renounce a badge.
     *
     * Emits {RoleRevoked} with the role id of the badge, if previously held by the user.
     */
    function renounceBadge(address user, uint8 badge) public virtual {
        // renounceRole checks that msg.sender is user
        renounceRole(_encodeBadgeRole(badge), user);
    }

    /**
     * @dev Returns a bitmap of the badges that are allowed to call a function of a target contract. If the target
     * contract is in a group, the group's permissions are returned.
     */
    function getFunctionAllowedBadges(address target, bytes4 selector) public view virtual returns (bytes32) {
        return _getFunctionAllowedBadges(getContractGroup(target), selector);
    }

    /**
     * @dev Returns a bitmap of the badges that are allowed to call a function of a group of contracts.
     */
    function getFunctionAllowedBadges(string calldata group, bytes4 selector) public view virtual returns (bytes32) {
        return _getFunctionAllowedBadges(_encodeCustomGroup(group), selector);
    }

    /**
     * @dev Returns a bitmap of the badges that are allowed to call a function selector of a contract group.
     */
    function _getFunctionAllowedBadges(bytes32 group, bytes4 selector) internal view virtual returns (bytes32) {
        if (group == _GROUP_OPEN) {
            return _badgeMask(_BADGE_PUBLIC);
        } else if (group == _GROUP_CLOSED) {
            return 0;
        } else {
            return _allowedBadges[group][selector];
        }
    }

    /**
     * @dev Changes whether a badge is allowed to call a function of a contract group, according to the `allowed`
     * argument. The caller must be the default admin.
     */
    function setFunctionAllowedBadge(
        address target,
        bytes4[] calldata selectors,
        uint8 badge,
        bool allowed
    ) public virtual {
        require(_contractGroup[target] == 0);
        _setFunctionAllowedBadge(_encodeSoloGroup(target), selectors, badge, allowed);
    }

    /**
     * @dev Changes whether a badge is allowed to call a function of a contract group, according to the `allowed`
     * argument. The caller must be the default admin.
     */
    function setFunctionAllowedBadge(
        string calldata group,
        bytes4[] calldata selectors,
        uint8 badge,
        bool allowed
    ) public virtual {
        _setFunctionAllowedBadge(_encodeCustomGroup(group), selectors, badge, allowed);
    }

    /**
     * @dev Changes whether a badge is allowed to call a function of a contract group, according to the `allowed`
     * argument. The caller must be the default admin.
     */
    function _setFunctionAllowedBadge(
        bytes32 group,
        bytes4[] calldata selectors,
        uint8 badge,
        bool allowed
    ) internal virtual onlyDefaultAdmin {
        require(group != 0);
        for (uint256 i = 0; i < selectors.length; i++) {
            bytes4 selector = selectors[i];
            _allowedBadges[group][selector] = _withUpdatedBadge(_allowedBadges[group][selector], badge, allowed);
            emit BadgeAllowed(group, selector, badge, allowed);
        }
    }

    /**
     * @dev Returns the group of the target contract, which may be its solo group (the default), a custom group, or
     * the open or closed groups.
     */
    function getContractGroup(address target) public view virtual returns (bytes32) {
        bytes32 group = _contractGroup[target];
        if (group == _GROUP_UNSET) {
            return _encodeSoloGroup(target);
        } else {
            return group;
        }
    }

    // TODO: filter open/closed?
    /**
     * @dev Sets the contract group that the target belongs to. The caller must be the default admin.
     *
     * CAUTION: This is a batch operation that will immediately switch the mapping of functions to allowed badges.
     * Accounts that were previously able to call permissioned functions on the target contract may no longer be
     * allowed, and new sets of account may be allowed after this operation.
     */
    function setContractGroup(address target, string calldata groupName) public virtual onlyDefaultAdmin {
        bytes32 group = _encodeCustomGroup(groupName);
        _contractGroup[target] = group;
        emit ContractGroupUpdated(target, group);
    }

    /**
     * @dev Sets the target contract to be in the "open" group. All restricted functions in the target contract will
     * become callable by anyone. The caller must be the default admin.
     */
    function setContractOpen(address target) public virtual onlyDefaultAdmin {
        bytes32 group = _GROUP_OPEN;
        _contractGroup[target] = group;
        emit ContractGroupUpdated(target, group);
    }

    /**
     * @dev Sets the target contract to be in the "closed" group. All restricted functions in the target contract will
     * be closed down and disallowed to all. The caller must be the default admin.
     */
    function setContractClosed(address target) public virtual onlyDefaultAdmin {
        bytes32 group = _GROUP_CLOSED;
        _contractGroup[target] = group;
        emit ContractGroupUpdated(target, group);
    }

    /**
     * @dev Creates a new badge.
     *
     * Emits {BadgeUpdated}.
     */
    function _createBadge(uint8 badge, string memory name) internal virtual {
        require(!hasBadge(badge));
        _createdBadges = _withUpdatedBadge(_createdBadges, badge, true);
        emit BadgeUpdated(badge, name);
    }

    /**
     * @dev Augmented version of {AccessControl-_grantRole} that keeps track of user badge bitmaps.
     */
    function _grantRole(bytes32 role, address user) internal virtual override {
        super._grantRole(role, user);
        (bool isBadge, uint8 badge) = _decodeBadgeRole(role);
        if (isBadge) {
            require(hasBadge(badge));
            _userBadges[user] = _withUpdatedBadge(_userBadges[user], badge, true);
        }
    }

    /**
     * @dev Augmented version of {AccessControl-_revokeRole} that keeps track of user badge bitmaps.
     */
    function _revokeRole(bytes32 role, address user) internal virtual override {
        super._revokeRole(role, user);
        (bool isBadge, uint8 badge) = _decodeBadgeRole(role);
        if (isBadge) {
            require(hasBadge(badge));
            require(badge != _BADGE_PUBLIC);
            _userBadges[user] = _withUpdatedBadge(_userBadges[user], badge, false);
        }
    }

    /**
     * @dev Returns the {AccessControl} role id that corresponds to a badge.
     *
     * This role id starts with the ASCII characters `badge:`, followed by zeroes, and ends with the single byte
     * corresponding to the badge number.
     */
    function _encodeBadgeRole(uint8 badge) internal virtual pure returns (bytes32) {
        return bytes32("badge:") | bytes32(uint256(badge));
    }

    /**
     * @dev Decodes a role id into a badge, if it is a role id of the kind returned by {_encodeBadgeRole}.
     */
    function _decodeBadgeRole(bytes32 role) internal virtual pure returns (bool, uint8) {
        bytes32 tagMask = ~bytes32(uint256(0xff));
        bytes32 tag = role & tagMask;
        uint8 badge  = uint8(role[31]);
        return (tag == bytes32("badge:"), badge);
    }

    /**
     * @dev Returns the solo group id for a target contract.
     *
     * The group id consists of the ASCII characters `group:solo:` followed by the contract address bytes.
     */
    function _encodeSoloGroup(address target) internal virtual pure returns (bytes32) {
        return _GROUP_SOLO_PREFIX | (bytes32(bytes20(target)) >> (_GROUP_SOLO_PREFIX.length << 3));
    }

    /**
     * @dev Returns the custom group id for a given group name.
     *
     * The group id consists of the ASCII characters `group:custom:` followed by the group name.
     */
    function _encodeCustomGroup(string calldata groupName) internal virtual pure returns (bytes32) {
        require(!_containsNullBytes(bytes32(bytes(groupName)), bytes(groupName).length));
        require(bytes(groupName).length + _GROUP_CUSTOM_PREFIX.length < 31);
        return _GROUP_CUSTOM_PREFIX | (bytes32(bytes(groupName)) >> (_GROUP_CUSTOM_PREFIX.length << 3));
    }

    /**
     * @dev Returns the custom group id for a given group name.
     *
     * The group id consists of the ASCII characters `group:custom:` followed by the group name.
     */
    function _decodeCustomGroup(bytes32 group) internal virtual pure returns (string memory) {
        string memory name = new string(32);
        uint256 nameLength = uint256(group) & 0xff;
        bytes32 nameBytes = group << _GROUP_CUSTOM_PREFIX.length;
        /// @solidity memory-safe-assembly
        assembly {
            mstore(name, nameLength)
            mstore(add(name, 0x20), nameBytes)
        }
        return name;
    }

    /**
     * @dev Returns true if the group is one of "open", "closed", or unset (zero).
     */
    function _isSpecialGroup(bytes32 group) private pure returns (bool) {
        return group == _GROUP_OPEN || group == _GROUP_CLOSED;
    }

    /**
     * @dev Returns a bit mask where the only non-zero bit is the badge number bit.
     */
    function _badgeMask(uint8 badge) private pure returns (bytes32) {
        return bytes32(1 << badge);
    }

    /**
     * @dev Returns the value of the badge number bit in a bitmap.
     */
    function _getBadge(bytes32 bitmap, uint8 badge) private pure returns (bool) {
        return bitmap & _badgeMask(badge) > 0;
    }

    /**
     * @dev Returns a new badge bitmap where a specific badge was updated.
     */
    function _withUpdatedBadge(bytes32 bitmap, uint8 badge, bool value) private pure returns (bytes32) {
        bytes32 mask = _badgeMask(badge);
        if (value) {
            return bitmap | mask;
        } else {
            return bitmap & ~mask;
        }
    }

    /**
     * @dev Returns true if the word contains any NUL bytes in the highest `scope` bytes. `scope` must be at most 32.
     */
    function _containsNullBytes(bytes32 word, uint256 scope) private pure returns (bool) {
        // We will operate on every byte of the word simultaneously
        // We visualize the 8 bits of each byte as word[i] = 01234567

        // Take bitwise OR of all bits in each byte 
        word |= word >> 4; // word[i] = 01234567 | ____0123 = ____abcd
        word |= word >> 2; // word[i] = ____abcd | ______ab = ______xy
        word |= word >> 1; // word[i] = ______xy | _______x = _______z

        // z is 1 iff any bit of word[i] is 1

        // Every byte in `low` is 0x01
        bytes32 low = hex"0101010101010101010101010101010101010101010101010101010101010101";

        // Select the lowest bit only and take its complement
        word &= low; // word[i] = 0000000z
        word ^= low; // word[i] = 0000000Z (Z = ~z)

        // Ignore anything past the scope
        unchecked {
            word >>= 32 - scope;
        }

        // If any byte in scope was 0x00 it will now contain 00000001
        return word != 0;
    }
}
