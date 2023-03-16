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

    function getUserTeams(address user) external view returns (bytes32 teams);

    function grantTeam(address user, uint8 team) external;

    function revokeTeam(address user, uint8 team) external;

    function renounceTeam(address user, uint8 team) external;

    function getFunctionAllowedTeams(bytes32 group, bytes4 selector) external view returns (bytes32 teams);

    function setFunctionAllowedTeam(bytes32 group, bytes4 selector, uint8 team, bool allowed) external;

    function getContractGroup(address target) external view returns (bytes32 group);

    function setContractGroup(address target, bytes32 group) external;

    function setContractOpen(address target) external;

    function setContractClosed(address target) external;

    // TODO: Ability to eject a contract. See AccessManaged.setAuthority
    // function transferContractAuthority(address target) external;
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
 * Contracts in the system are grouped as well. These are simply called "contract groups". There can be an arbitrary
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
 * There is a special team defined by default named "all" of which all accounts are considered members, and two special
 * contract groups: 1) the "open" group, where all functions are allowed to the "all" team, and 2) the "closed" group,
 * where no function is allowed to any team.
 *
 * Permissioning schemes and team and contract group assignments can be configured by the default admin. The contract
 * includes {AccessControlDefaultAdminRules} by default to enforce security rules on this account. Additionally, it is
 * expected that the account will be highly secured (e.g., a multisig or a well-configured DAO) as all the permissions
 * of the managed system can be modified by it.
 */
contract AccessManager is IAccessManager, AccessControlDefaultAdminRules {
    bytes32 _createdTeams;
    mapping(address => bytes32) private _userTeams;
    mapping(bytes32 => mapping(bytes4 => bytes32)) private _allowedTeams;
    mapping(address => bytes32) private _contractGroup;

    uint8 private constant _TEAM_ALL = 255;
    bytes32 private constant _GROUP_UNSET = 0;
    bytes32 private constant _GROUP_OPEN = "group:open";
    bytes32 private constant _GROUP_CLOSED = "group:closed";

    /**
     * @dev Initializes an AccessManager with initial default admin and transfer delay.
     */
    constructor(
        uint48 initialDefaultAdminDelay,
        address initialDefaultAdmin
    ) AccessControlDefaultAdminRules(initialDefaultAdminDelay, initialDefaultAdmin) {
        createTeam(_TEAM_ALL, "all");
    }

    /**
     * @dev Returns true if the caller can invoke on a target the function identified by a function selector.
     * Entrypoint for {AccessManaged} contracts.
     */
    function canCall(address caller, address target, bytes4 selector) public view returns (bool) {
        bytes32 group = getContractGroup(target);
        bytes32 allowedTeams = getFunctionAllowedTeams(group, selector);
        bytes32 callerTeams = getUserTeams(caller);
        return callerTeams & allowedTeams != 0;
    }

    /**
     * @dev Creates a new team with a team number that can be chosen arbitrarily but must be unused, and gives it a
     * human-readable name. The caller must be the default admin.
     *
     * Emits {TeamUpdated}.
     */
    function createTeam(uint8 team, string memory name) public virtual onlyDefaultAdmin {
        require(!_teamExists(team));
        _setTeam(_createdTeams, team, true);
        emit TeamUpdated(team, name);
    }

    /**
     * @dev Updates an existing team's name. The caller must be the default admin.
     */
    function updateTeamName(uint8 team, string calldata name) public virtual onlyDefaultAdmin {
        require(team != _TEAM_ALL && _teamExists(team));
        emit TeamUpdated(team, name);
    }

    /**
     * @dev Returns a bitmap of the teams the user is a member of. Bit `n` is set if the user is in team `n`,
     * counting from least significant bit.
     */
    function getUserTeams(address user) public view virtual returns (bytes32) {
        return _userTeams[user] | _teamMask(_TEAM_ALL);
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
     * @dev Returns a bitmap of the teams that are allowed to call a function selector on contracts belonging to a
     * group. Bit `n` is set if team `n` is allowed, counting from least significant bit.
     */
    function getFunctionAllowedTeams(bytes32 group, bytes4 selector) public view virtual returns (bytes32) {
        if (group == _GROUP_OPEN) {
            return _teamMask(_TEAM_ALL);
        } else if (group == _GROUP_CLOSED) {
            return 0;
        } else {
            return _allowedTeams[group][selector];
        }
    }

    /**
     * @dev Changes whether a team is allowed to call a function selector on contracts belonging to a group, according
     * to the `allowed` argument. The caller must be the default admin.
     */
    function setFunctionAllowedTeam(
        bytes32 group,
        bytes4 selector,
        uint8 team,
        bool allowed
    ) public virtual onlyDefaultAdmin {
        require(group != 0);
        _allowedTeams[group][selector] = _setTeam(_allowedTeams[group][selector], team, allowed);
        emit TeamAllowed(group, selector, team, allowed);
    }

    /**
     * @dev Returns the contract group that the target contract currently belongs to. May be 0 if not set.
     */
    function getContractGroup(address target) public view virtual returns (bytes32) {
        return _contractGroup[target];
    }

    /**
     * @dev Sets the contract group that the target belongs to. The caller must be the default admin.
     *
     * CAUTION: This is a batch operation that will immediately switch the mapping of functions to allowed teams.
     * Accounts that were previously able to call permissioned functions on the target contract may no longer be
     * allowed, and new sets of account may be allowed after this operation.
     */
    function setContractGroup(address target, bytes32 group) public virtual onlyDefaultAdmin {
        require(!_isSpecialGroup(group));
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
     * @dev Returns true if the team has already been created via {createTeam}.
     */
    function _teamExists(uint8 team) internal virtual returns (bool) {
        return _getTeam(_createdTeams, team);
    }

    /**
     * @dev Augmented version of {AccessControl-_grantRole} that keeps track of user team bitmaps.
     */
    function _grantRole(bytes32 role, address user) internal virtual override {
        super._grantRole(role, user);
        (bool isTeam, uint8 team) = _decodeTeamRole(role);
        if (isTeam) {
            require(_teamExists(team));
            _userTeams[user] = _setTeam(_userTeams[user], team, true);
        }
    }

    /**
     * @dev Augmented version of {AccessControl-_revokeRole} that keeps track of user team bitmaps.
     */
    function _revokeRole(bytes32 role, address user) internal virtual override {
        super._revokeRole(role, user);
        (bool isTeam, uint8 team) = _decodeTeamRole(role);
        if (isTeam) {
            require(_teamExists(team));
            require(team != _TEAM_ALL);
            _userTeams[user] = _setTeam(_userTeams[user], team, false);
        }
    }

    /**
     * @dev Returns the {AccessControl} role id that corresponds to a team.
     *
     * This role id starts with the ASCII characters `team:`, followed by zeroes, and ends with the single byte
     * corresponding to the team number.
     */
    function _encodeTeamRole(uint8 team) internal virtual view returns (bytes32) {
        return bytes32("team:") | bytes32(uint256(team));
    }

    /**
     * @dev Decodes a role id into a team, if it is a role id of the kind returned by {_encodeTeamRole}.
     */
    function _decodeTeamRole(bytes32 role) internal virtual returns (bool, uint8) {
        bytes32 tagMask = hex"ffffffff";
        bytes32 teamMask = hex"ff";
        bool isTeam = (role & tagMask) == bytes32("team:");
        uint8 team = uint8(uint256(role & teamMask));
        return (isTeam, team);
    }

    /**
     * @dev Returns true if the group is one of "open", "closed", or unset (zero).
     */
    function _isSpecialGroup(bytes32 group) private pure returns (bool) {
        return group == _GROUP_UNSET || group == _GROUP_OPEN || group == _GROUP_CLOSED;
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
     * @dev Changes the value of the team number bit in a bitmap.
     */
    function _setTeam(bytes32 bitmap, uint8 team, bool value) private pure returns (bytes32) {
        bytes32 mask = _teamMask(team);
        if (value) {
            return bitmap | mask;
        } else {
            return bitmap & ~mask;
        }
    }
}
