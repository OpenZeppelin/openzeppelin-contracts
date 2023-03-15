// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./AccessControl.sol";
import "./AccessControlDefaultAdminRules.sol";

interface IAuthority {
    function canCall(address caller, address target, bytes4 selector) external view returns (bool allowed);
}

/// AccessManager is a central contract that stores the permissions of a system. It is an AccessControl contract, i.e.
/// it has roles and all the standard functions like `grantRole` and `revokeRole`, but it defines a particular set of
/// roles, with a particular structure.
/// 
/// Users are grouped in "teams". Teams must be created before users can be assigned into them, up to a maximum of 256
/// teams. A user can be assigned to multiple teams. Each team defines an AccessControl role, identified by a role id of
/// the form [specific format TBD, something like "<team role tag> ... <team number (0-255)>"].
/// 
/// Contracts in the system are also grouped. These are simply called "contract groups". There can be an arbitrary
/// number of groups. Each contract can only be in one group at a time. In the simplest setup, each contract is assigned
/// to its own separate group, but groups can also be shared among similar contracts. Each group has a group admin role
/// whose members are allowed to add new contracts in the system into that contract group.
/// 
/// All contracts in a group share the same permissioning scheme. A permissioning scheme consists of a mapping between
/// functions and allowed teams. Each function can be allowed to multiple teams, meaning that if a user is in at least
/// one of the allowed teams they can call that funcion.
/// 
/// TODO: Implement AccessMode (from zkSync AllowList) in terms of teams and groups.
///   - Define the built-in "all" team (#255?) of which everyone is a member.
///   - Define a contract group where every function is allowed to the "all" group. (-> AccessMode = Open)
///   - Define a contract group where no function is allowed to any group. (-> AccessMode = Closed)
interface IAccessManager is IAuthority {
    function createTeam(uint8 team, string calldata name) external;

    function updateTeam(uint8 team, string calldata name) external;

    // The result is a bit mask.
    function getUserTeams(address user) external view returns (bytes32 teams);

    // The result is a bit mask.
    function getFunctionAllowedTeams(bytes32 group, bytes4 selector) external view returns (bytes32 teams);

    function addFunctionAllowedTeam(bytes32 group, bytes4 selector, uint8 team) external;

    function removeFunctionAllowedTeam(bytes32 group, bytes4 selector, uint8 team) external;

    function getContractGroup(address target) external view returns (bytes32 group);

    function setContractGroup(address target, bytes32 group) external;

    function setInitialContractGroup(address target, bytes32 group) external;

    function getContractGroupAdmin(bytes32 group) external view returns (bytes32 adminRole);

    function setContractGroupAdmin(bytes32 group, bytes32 adminRole) external;

    function setRoleAdmin(bytes32 role, bytes32 adminRole) external;
}

contract AccessManager is IAccessManager, AccessControl /*, AccessControlDefaultAdminRules */ {
    bytes32 _createdTeams;
    mapping (address => bytes32) private _userTeams;
    mapping (bytes32 => mapping (bytes4 => bytes32)) private _allowedTeams;
    mapping (address => bytes32) private _contractGroup;
    mapping (bytes32 => bytes32) private _groupAdmin;

    event TeamUpdated(uint8 indexed team, string name);
    event ContractGroupAdminUpdated(bytes32 indexed group, bytes32 indexed adminRole);
    event TargetGroupUpdated(address indexed target, bytes32 indexed group);

    function canCall(address caller, address target, bytes4 selector) public view returns (bool) {
        bytes32 group = getContractGroup(target);
        bytes32 allowedTeams = getFunctionAllowedTeams(group, selector);
        bytes32 callerTeams = getUserTeams(caller);
        return callerTeams & allowedTeams != 0;
    }

    function createTeam(uint8 team, string calldata name) public virtual onlyDefaultAdmin {
        require(!_teamExists(team));
        emit TeamUpdated(team, name);
    }

    function updateTeam(uint8 team, string calldata name) public virtual onlyDefaultAdmin {
        require(_teamExists(team));
        emit TeamUpdated(team, name);
    }

    function _teamExists(uint8 team) internal virtual returns (bool) {
        return _getBit(_createdTeams, team);
    }

    function getUserTeams(address user) public view virtual returns (bytes32) {
        return _userTeams[user];
    }

    function _grantRole(bytes32 role, address user) internal virtual override {
        super._grantRole(role, user);
        (bool isTeam, uint8 team) = _parseTeamRole(role);
        if (isTeam) {
            require(_teamExists(team));
            _userTeams[user] = _setBit(_userTeams[user], team, true);
        }
    }

    function _revokeRole(bytes32 role, address user) internal virtual override {
        super._revokeRole(role, user);
        (bool isTeam, uint8 team) = _parseTeamRole(role);
        if (isTeam) {
            require(_teamExists(team));
            _userTeams[user] = _setBit(_userTeams[user], team, false);
        }
    }

    function _parseTeamRole(bytes32 role) internal virtual returns (bool, uint8) {
        bool isTeam = bytes1(role) == hex"01";
        uint8 team = uint8(uint256(role & hex"ff"));
        return (isTeam, team);
    }

    function getFunctionAllowedTeams(bytes32 group, bytes4 selector) public view virtual returns (bytes32) {
        return _allowedTeams[group][selector];
    }

    function addFunctionAllowedTeam(bytes32 group, bytes4 selector, uint8 team) public virtual onlyDefaultAdmin {
        _allowedTeams[group][selector] = _setBit(_allowedTeams[group][selector], team, true);
    }

    function removeFunctionAllowedTeam(bytes32 group, bytes4 selector, uint8 team) public virtual onlyDefaultAdmin {
        _allowedTeams[group][selector] = _setBit(_allowedTeams[group][selector], team, false);
    }

    function getContractGroup(address target) public view virtual returns (bytes32) {
        return _contractGroup[target];
    }

    function setContractGroup(address target, bytes32 group) public virtual onlyDefaultAdmin {
        _contractGroup[target] = group;
    }

    function setInitialContractGroup(address target, bytes32 group) public virtual {
        _checkRole(getContractGroupAdmin(group));

        require(group != 0); // todo: make group optional, default to target-specific group
        require(_contractGroup[target] == 0);
        _contractGroup[target] = group;

        emit TargetGroupUpdated(target, group);
    }

    function getContractGroupAdmin(bytes32 group) public view virtual returns (bytes32) {
        return _groupAdmin[group];
    }

    function setContractGroupAdmin(bytes32 group, bytes32 adminRole) public virtual onlyDefaultAdmin {
        _groupAdmin[group] = adminRole;
        emit ContractGroupAdminUpdated(group, adminRole);
    }

    function setRoleAdmin(bytes32 role, bytes32 adminRole) public virtual onlyDefaultAdmin {
        // todo: validate that the roles "exist"?
        _setRoleAdmin(role, adminRole);
    }

    function _getBit(bytes32 bitmap, uint8 pos) private pure returns (bool) {
        bytes32 mask = bytes32(1 << pos);
        return bitmap & mask > 0;
    }

    function _setBit(bytes32 bitmap, uint8 pos, bool val) private pure returns (bytes32) {
        bytes32 mask = bytes32(1 << pos);
        if (val) {
            return bitmap | mask;
        } else {
            return bitmap & ~mask;
        }
    }
}
