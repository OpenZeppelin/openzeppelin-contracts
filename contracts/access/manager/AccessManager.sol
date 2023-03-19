// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../AccessControl.sol";
import "../AccessControlDefaultAdminRules.sol";
import "../../utils/Create2.sol";
import "./IAuthority.sol";

interface IAccessManager is IAuthority {
    event TeamUpdated(uint8 indexed team, string name);

    event TeamAllowed(bytes32 indexed group, bytes4 indexed selector, uint8 indexed team, bool allowed);

    event ContractGroupUpdated(address indexed target, bytes32 indexed group);

    function createTeam(uint8 team, string calldata name) external;

    function updateTeamName(uint8 team, string calldata name) external;

    function hasTeam(uint8 team) external view returns (bool);

    function getUserTeams(address user) external view returns (bytes32 teams);

    function grantTeam(address user, uint8 team) external;

    function revokeTeam(address user, uint8 team) external;

    function renounceTeam(address user, uint8 team) external;

    function getFunctionAllowedTeams(address target, bytes4 selector) external view returns (bytes32 teams);
    function getFunctionAllowedTeams(string calldata group, bytes4 selector) external view returns (bytes32 teams);

    function setFunctionAllowedTeam(address target, bytes4[] calldata selectors, uint8 team, bool allowed) external;
    function setFunctionAllowedTeam(string calldata group, bytes4[] calldata selectors, uint8 team, bool allowed) external;

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
 * Users are grouped in "teams". Teams must be created before users can be assigned into them, up to a maximum of 255
 * teams. A user can be assigned to multiple teams. Each team defines an AccessControl role, identified by a role id
 * that starts with the ASCII characters `team:`, followed by zeroes, and ending with the single byte corresponding to
 * the team number.
 *
 * Contracts in the system may be grouped as well. These are simply called "contract groups". There can be an arbitrary
 * number of groups. Each contract can only be in one group at a time. In the simplest setup, each contract is assigned
 * to its own separate group, but groups can also be shared among similar contracts.
 *
 * All contracts in a group share the same permissioning scheme. A permissioning scheme consists of a mapping between
 * functions and allowed teams. Each function can be allowed to multiple teams, meaning that if a user is in at least
 * one of the allowed teams they can call that function.
 *
 * Note that a function in a target contract may become permissioned only when: 1) said contract is {AccessManaged} and
 * is connected to this contract as its manager, and 2) said function is decorated with the `restricted` modifier.
 *
 * There is a special team defined by default named "public" of which all accounts are automatically members, and two
 * special contract groups: 1) the "open" group, where all functions are allowed to the "public" team, and 2) the
 * "closed" group, where no function is allowed to any team.
 *
 * Permissioning schemes and team and contract group assignments can be configured by the default admin. The contract
 * includes {AccessControlDefaultAdminRules} by default to enforce security rules on this account. Additionally, it is
 * expected that the account will be highly secured (e.g., a multisig or a well-configured DAO) as all the permissions
 * of the managed system can be modified by it.
 *
 * NOTE: Some of the functions in this contract, such as {getUserTeams}, return a `bytes32` bitmap to succintly
 * represent a set of teams. In a bitmap, bit `n` (counting from the least significant bit) will be 1 if and only if
 * the team with number `n` is in the set.
 */
contract AccessManager is IAccessManager, AccessControlDefaultAdminRules {
    bytes32 _createdTeams;
    mapping(address => bytes32) private _userTeams;
    mapping(bytes32 => mapping(bytes4 => bytes32)) private _allowedTeams;
    mapping(address => bytes32) private _contractGroup;

    uint8 private constant _TEAM_PUBLIC = 255;

    bytes32 private constant _GROUP_UNSET = 0;
    bytes32 private constant _GROUP_OPEN = "group:open";
    bytes32 private constant _GROUP_CLOSED = "group:closed";

    bytes14 private constant _GROUP_ISOLATE_PREFIX = "group:isolate:";
    bytes13 private constant _GROUP_CUSTOM_PREFIX = "group:custom:";

    /**
     * @dev Initializes an AccessManager with initial default admin and transfer delay.
     */
    constructor(
        uint48 initialDefaultAdminDelay,
        address initialDefaultAdmin
    ) AccessControlDefaultAdminRules(initialDefaultAdminDelay, initialDefaultAdmin) {
        _createTeam(_TEAM_PUBLIC, "public");
    }

    /**
     * @dev Returns true if the caller can invoke on a target the function identified by a function selector.
     * Entrypoint for {AccessManaged} contracts.
     */
    function canCall(address caller, address target, bytes4 selector) public view returns (bool) {
        bytes32 allowedTeams = getFunctionAllowedTeams(target, selector);
        bytes32 callerTeams = getUserTeams(caller);
        return callerTeams & allowedTeams != 0;
    }

    /**
     * @dev Creates a new team with a team number that can be chosen arbitrarily but must be unused, and gives it a
     * human-readable name. The caller must be the default admin.
     *
     * Team numbers are not auto-incremented in order to avoid race conditions, but administrators can safely use
     * sequential numbers.
     *
     * Emits {TeamUpdated}.
     */
    function createTeam(uint8 team, string memory name) public virtual onlyDefaultAdmin {
        _createTeam(team, name);
    }

    /**
     * @dev Updates an existing team's name. The caller must be the default admin.
     */
    function updateTeamName(uint8 team, string memory name) public virtual onlyDefaultAdmin {
        require(team != _TEAM_PUBLIC && hasTeam(team));
        emit TeamUpdated(team, name);
    }

    /**
     * @dev Returns true if the team has already been created via {createTeam}.
     */
    function hasTeam(uint8 team) public virtual view returns (bool) {
        return _getTeam(_createdTeams, team);
    }

    /**
     * @dev Returns a bitmap of the teams the user is a member of. See note on bitmaps above.
     */
    function getUserTeams(address user) public view virtual returns (bytes32) {
        return _userTeams[user] | _teamMask(_TEAM_PUBLIC);
    }

    /**
     * @dev Adds a user to a team.
     *
     * Emits {RoleGranted} with the role id of the team, if not previously a member.
     */
    function grantTeam(address user, uint8 team) public virtual {
        // grantRole checks that msg.sender is admin for the role
        grantRole(_encodeTeamRole(team), user);
    }

    /**
     * @dev Removes a user from a team.
     *
     * Emits {RoleRevoked} with the role id of the team, if previously a member.
     */
    function revokeTeam(address user, uint8 team) public virtual {
        // revokeRole checks that msg.sender is admin for the role
        revokeRole(_encodeTeamRole(team), user);
    }

    /**
     * @dev Renounces a user from a team.
     *
     * Emits {RoleRevoked} with the role id of the team, if previously a member.
     */
    function renounceTeam(address user, uint8 team) public virtual {
        // renounceRole checks that msg.sender is user
        renounceRole(_encodeTeamRole(team), user);
    }

    /**
     * @dev Returns a bitmap of the teams that are allowed to call a function of a target contract. If the target
     * contract is in a group, the group's permissions are returned.
     */
    function getFunctionAllowedTeams(address target, bytes4 selector) public view virtual returns (bytes32) {
        return _getFunctionAllowedTeams(getContractGroup(target), selector);
    }

    /**
     * @dev Returns a bitmap of the teams that are allowed to call a function of a group of contracts.
     */
    function getFunctionAllowedTeams(string calldata group, bytes4 selector) public view virtual returns (bytes32) {
        return _getFunctionAllowedTeams(_encodeCustomGroup(group), selector);
    }

    /**
     * @dev Returns a bitmap of the teams that are allowed to call a function selector of a contract group.
     */
    function _getFunctionAllowedTeams(bytes32 group, bytes4 selector) internal view virtual returns (bytes32) {
        if (group == _GROUP_OPEN) {
            return _teamMask(_TEAM_PUBLIC);
        } else if (group == _GROUP_CLOSED) {
            return 0;
        } else {
            return _allowedTeams[group][selector];
        }
    }

    /**
     * @dev Changes whether a team is allowed to call a function of a contract group, according to the `allowed`
     * argument. The caller must be the default admin.
     */
    function setFunctionAllowedTeam(
        address target,
        bytes4[] calldata selectors,
        uint8 team,
        bool allowed
    ) public virtual {
        require(_contractGroup[target] == 0);
        _setFunctionAllowedTeam(_encodeIsolateGroup(target), selectors, team, allowed);
    }

    /**
     * @dev Changes whether a team is allowed to call a function of a contract group, according to the `allowed`
     * argument. The caller must be the default admin.
     */
    function setFunctionAllowedTeam(
        string calldata group,
        bytes4[] calldata selectors,
        uint8 team,
        bool allowed
    ) public virtual {
        _setFunctionAllowedTeam(_encodeCustomGroup(group), selectors, team, allowed);
    }

    /**
     * @dev Changes whether a team is allowed to call a function of a contract group, according to the `allowed`
     * argument. The caller must be the default admin.
     */
    function _setFunctionAllowedTeam(
        bytes32 group,
        bytes4[] calldata selectors,
        uint8 team,
        bool allowed
    ) internal virtual onlyDefaultAdmin {
        require(group != 0);
        for (uint256 i = 0; i < selectors.length; i++) {
            bytes4 selector = selectors[i];
            _allowedTeams[group][selector] = _withUpdatedTeam(_allowedTeams[group][selector], team, allowed);
            emit TeamAllowed(group, selector, team, allowed);
        }
    }

    /**
     * @dev Returns the group of the target contract, which may be its isolate group (the default), a custom group, or
     * the open or closed groups.
     */
    function getContractGroup(address target) public view virtual returns (bytes32) {
        bytes32 group = _contractGroup[target];
        if (group == _GROUP_UNSET) {
            return _encodeIsolateGroup(target);
        } else {
            return group;
        }
    }

    // TODO: filter open/closed?
    /**
     * @dev Sets the contract group that the target belongs to. The caller must be the default admin.
     *
     * CAUTION: This is a batch operation that will immediately switch the mapping of functions to allowed teams.
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
     * @dev Creates a new team.
     *
     * Emits {TeamUpdated}.
     */
    function _createTeam(uint8 team, string memory name) internal virtual {
        require(!hasTeam(team));
        _createdTeams = _withUpdatedTeam(_createdTeams, team, true);
        emit TeamUpdated(team, name);
    }

    /**
     * @dev Augmented version of {AccessControl-_grantRole} that keeps track of user team bitmaps.
     */
    function _grantRole(bytes32 role, address user) internal virtual override {
        super._grantRole(role, user);
        (bool isTeam, uint8 team) = _decodeTeamRole(role);
        if (isTeam) {
            require(hasTeam(team));
            _userTeams[user] = _withUpdatedTeam(_userTeams[user], team, true);
        }
    }

    /**
     * @dev Augmented version of {AccessControl-_revokeRole} that keeps track of user team bitmaps.
     */
    function _revokeRole(bytes32 role, address user) internal virtual override {
        super._revokeRole(role, user);
        (bool isTeam, uint8 team) = _decodeTeamRole(role);
        if (isTeam) {
            require(hasTeam(team));
            require(team != _TEAM_PUBLIC);
            _userTeams[user] = _withUpdatedTeam(_userTeams[user], team, false);
        }
    }

    /**
     * @dev Returns the {AccessControl} role id that corresponds to a team.
     *
     * This role id starts with the ASCII characters `team:`, followed by zeroes, and ends with the single byte
     * corresponding to the team number.
     */
    function _encodeTeamRole(uint8 team) internal virtual pure returns (bytes32) {
        return bytes32("team:") | bytes32(uint256(team));
    }

    /**
     * @dev Decodes a role id into a team, if it is a role id of the kind returned by {_encodeTeamRole}.
     */
    function _decodeTeamRole(bytes32 role) internal virtual pure returns (bool, uint8) {
        bytes32 tagMask = ~bytes32(uint256(0xff));
        bytes32 tag = role & tagMask;
        uint8 team  = uint8(role[31]);
        return (tag == bytes32("team:"), team);
    }

    /**
     * @dev Returns the isolate group id for a target contract.
     *
     * The group id consists of the ASCII characters `group:isolate:` followed by the contract address bytes.
     */
    function _encodeIsolateGroup(address target) internal virtual pure returns (bytes32) {
        return _GROUP_ISOLATE_PREFIX | (bytes20(target) >> _GROUP_ISOLATE_PREFIX.length);
    }

    /**
     * @dev Returns the custom group id for a given group name.
     *
     * The group id consists of the ASCII characters `group:custom:` followed by the group name.
     */
    function _encodeCustomGroup(string calldata groupName) internal virtual pure returns (bytes32) {
        require(!_containsNullBytes(bytes32(bytes(groupName)), bytes(groupName).length));
        require(bytes(groupName).length + _GROUP_CUSTOM_PREFIX.length < 31);
        return _GROUP_CUSTOM_PREFIX | (bytes32(bytes(groupName)) >> _GROUP_CUSTOM_PREFIX.length);
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
     * @dev Returns a bit mask where the only non-zero bit is the team number bit.
     */
    function _teamMask(uint8 team) private pure returns (bytes32) {
        return bytes32(1 << team);
    }

    /**
     * @dev Returns the value of the team number bit in a bitmap.
     */
    function _getTeam(bytes32 bitmap, uint8 team) private pure returns (bool) {
        return bitmap & _teamMask(team) > 0;
    }

    /**
     * @dev Returns a new team bitmap where a specific team was updated.
     */
    function _withUpdatedTeam(bytes32 bitmap, uint8 team, bool value) private pure returns (bytes32) {
        bytes32 mask = _teamMask(team);
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
