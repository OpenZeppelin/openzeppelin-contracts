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

    event BadgeUpdated(uint8 indexed badge, string name);

    event BadgeAllowed(address indexed target, bytes4 indexed selector, uint8 indexed badge, bool allowed);

    event RestrictedModeUpdated(address indexed target, RestrictedMode indexed mode);

    function createBadge(uint8 badge, string calldata name) external;

    function updateBadgeName(uint8 badge, string calldata name) external;

    function hasBadge(uint8 badge) external view returns (bool);

    function getUserBadges(address user) external view returns (bytes32 badges);

    function grantBadge(address user, uint8 badge) external;

    function revokeBadge(address user, uint8 badge) external;

    function renounceBadge(address user, uint8 badge) external;

    function getFunctionAllowedBadges(address target, bytes4 selector) external view returns (bytes32 badges);

    function setFunctionAllowedBadge(address target, bytes4[] calldata selectors, uint8 badge, bool allowed) external;

    function getContractMode(address target) external view returns (RestrictedMode);

    function setContractOpen(address target) external;

    function setContractClosed(address target) external;

    function transferContractAuthority(address target, address newAuthority) external;
}

/**
 * @dev AccessManager is a central contract to store the permissions of a system.
 *
 * The smart contracts under the control of an AccessManager instance will have a set of "restricted" functions, and the
 * exact details of how access is restricted for each of those functions is configurable by the admins of the instance.
 * These restrictions are expressed in terms of "badges".
 *
 * An AccessManager instance will define a set of badges. Each of them must be created before they can be granted, with
 * a maximum of 255 created badges. Users can be granted any number of these badges. Each of them defines an
 * AccessControl role, and may confer access to some of the restricted functions in the system, as configured by admins
 * through the use of {setFunctionAllowedBadge}.
 *
 * Note that a function in a target contract may become permissioned in this way only when: 1) said contract is
 * {AccessManaged} and is connected to this contract as its manager, and 2) said function is decorated with the
 * `restricted` modifier.
 *
 * There is a special badge defined by default named "public" which all accounts automatically have.
 *
 * Contracts can also be configured in two special modes: 1) the "open" mode, where all functions are allowed to the
 * "public" badge, and 2) the "closed" mode, where no function is allowed to any badge.
 *
 * Since all the permissions of the managed system can be modified by the admins of this instance, it is expected that
 * it will be highly secured (e.g., a multisig or a well-configured DAO). Additionally, {AccessControlDefaultAdminRules}
 * is included to enforce security rules on this account.
 *
 * NOTE: Some of the functions in this contract, such as {getUserBadges}, return a `bytes32` bitmap to succintly
 * represent a set of badges. In a bitmap, bit `n` (counting from the least significant bit) will be 1 if and only if
 * the badge with number `n` is in the set. For example, the hex value `0x05` represents the set of the two badges
 * numbered 0 and 2.
 */
contract AccessManager is IAccessManager, AccessControlDefaultAdminRules {
    bytes32 _createdBadges;

    mapping(address user => bytes32 badges) private _userBadges;
    mapping(address target => mapping(bytes4 selector => bytes32 badges)) private _allowedBadges;
    mapping(address target => RestrictedMode mode) private _contractMode;

    uint8 private constant _BADGE_PUBLIC = 255;

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
    function hasBadge(uint8 badge) public view virtual returns (bool) {
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
     * contract is in open or closed mode it will be reflected in the return value.
     */
    function getFunctionAllowedBadges(address target, bytes4 selector) public view virtual returns (bytes32) {
        RestrictedMode mode = getContractMode(target);
        if (mode == RestrictedMode.Open) {
            return _badgeMask(_BADGE_PUBLIC);
        } else if (mode == RestrictedMode.Closed) {
            return 0;
        } else {
            return _allowedBadges[target][selector];
        }
    }

    /**
     * @dev Changes whether a badge is allowed to call a function of a contract, according to the `allowed` argument.
     * The caller must be the default admin.
     */
    function setFunctionAllowedBadge(
        address target,
        bytes4[] calldata selectors,
        uint8 badge,
        bool allowed
    ) public virtual {
        require(_contractMode[target] == RestrictedMode.Custom);
        for (uint256 i = 0; i < selectors.length; i++) {
            bytes4 selector = selectors[i];
            _allowedBadges[target][selector] = _withUpdatedBadge(_allowedBadges[target][selector], badge, allowed);
            emit BadgeAllowed(target, selector, badge, allowed);
        }
    }

    /**
     * @dev Returns the mode of the target contract, which may be custom (`0`), closed (`1`), or open (`2`).
     */
    function getContractMode(address target) public view virtual returns (RestrictedMode) {
        return _contractMode[target];
    }

    /**
     * @dev Sets the target contract to be in "open" mode. All restricted functions in the target contract will become
     * callable by anyone. The caller must be the default admin.
     */
    function setContractOpen(address target) public virtual onlyDefaultAdmin {
        _contractMode[target] = RestrictedMode.Open;
        emit RestrictedModeUpdated(target, RestrictedMode.Open);
    }

    /**
     * @dev Sets the target contract to be in "closed" mode. All restricted functions in the target contract will be
     * closed down and disallowed to all. The caller must be the default admin.
     */
    function setContractClosed(address target) public virtual onlyDefaultAdmin {
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
    function _encodeBadgeRole(uint8 badge) internal pure virtual returns (bytes32) {
        return bytes32("badge:") | bytes32(uint256(badge));
    }

    /**
     * @dev Decodes a role id into a badge, if it is a role id of the kind returned by {_encodeBadgeRole}.
     */
    function _decodeBadgeRole(bytes32 role) internal pure virtual returns (bool, uint8) {
        bytes32 tagMask = ~bytes32(uint256(0xff));
        bytes32 tag = role & tagMask;
        uint8 badge = uint8(role[31]);
        return (tag == bytes32("badge:"), badge);
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
}
