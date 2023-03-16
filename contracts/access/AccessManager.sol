// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./AccessControl.sol";
import "./AccessControlDefaultAdminRules.sol";
import "../utils/Create2.sol";
import "../utils/Address.sol";

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
interface IAccessManager is IAuthority {
    event TeamNameUpdated(uint8 indexed team, string name);

    event TeamAllowed(bytes32 indexed group, bytes4 indexed selector, uint8 indexed team, bool allowed);

    event ContractGroupUpdated(address indexed target, bytes32 indexed group);

    function createTeam(uint8 team, string calldata name) external;

    function updateTeamName(uint8 team, string calldata name) external;

    // The result is a bit mask.
    function getUserTeams(address user) external view returns (bytes32 teams);

    function grantTeam(address user, uint8 team) external;

    function revokeTeam(address user, uint8 team) external;

    function renounceTeam(address user, uint8 team) external;

    // The result is a bit mask.
    function getFunctionAllowedTeams(bytes32 group, bytes4 selector) external view returns (bytes32 teams);

    function setFunctionAllowedTeam(bytes32 group, bytes4 selector, uint8 team, bool allowed) external;

    function getContractGroup(address target) external view returns (bytes32 group);

    function setContractGroup(address target, bytes32 group) external;

    function setContractOpen(address target) external;

    function setContractClosed(address target) external;
}

contract AccessManager is IAccessManager, AccessControlDefaultAdminRules {
    bytes32 _createdTeams;
    mapping (address => bytes32) private _userTeams;
    mapping (bytes32 => mapping (bytes4 => bytes32)) private _allowedTeams;
    mapping (address => bytes32) private _contractGroup;

    uint8 private constant _TEAM_ALL = 255;
    bytes32 private constant _GROUP_OPEN = "group:open";
    bytes32 private constant _GROUP_CLOSED = "group:closed";

    constructor(
        uint48 initialDefaultAdminDelay,
        address initialDefaultAdmin
    )
        AccessControlDefaultAdminRules(initialDefaultAdminDelay, initialDefaultAdmin)
    {
        createTeam(_TEAM_ALL, "all");
    }

    function canCall(address caller, address target, bytes4 selector) public view returns (bool) {
        bytes32 group = getContractGroup(target);
        bytes32 allowedTeams = getFunctionAllowedTeams(group, selector);
        bytes32 callerTeams = getUserTeams(caller);
        return callerTeams & allowedTeams != 0;
    }

    function createTeam(uint8 team, string memory name) public virtual onlyDefaultAdmin {
        require(!_teamExists(team));
        _setTeam(_createdTeams, team, true);
        emit TeamNameUpdated(team, name);
    }

    function updateTeamName(uint8 team, string calldata name) public virtual onlyDefaultAdmin {
        require(team != _TEAM_ALL && _teamExists(team));
        emit TeamNameUpdated(team, name);
    }

    function _teamExists(uint8 team) internal virtual returns (bool) {
        return _getTeam(_createdTeams, team);
    }

    function getUserTeams(address user) public view virtual returns (bytes32) {
        return _userTeams[user] | _teamMask(_TEAM_ALL);
    }

    function grantTeam(address user, uint8 team) public virtual {
        grantRole(_encodeTeamRole(team), user);
    }

    function revokeTeam(address user, uint8 team) public virtual {
        revokeRole(_encodeTeamRole(team), user);
    }

    function renounceTeam(address user, uint8 team) public virtual {
        renounceRole(_encodeTeamRole(team), user);
    }

    function getFunctionAllowedTeams(bytes32 group, bytes4 selector) public view virtual returns (bytes32) {
        if (group == _GROUP_OPEN) {
            return _teamMask(_TEAM_ALL);
        } else if (group == _GROUP_CLOSED) {
            return 0;
        } else {
            return _allowedTeams[group][selector];
        }
    }

    function setFunctionAllowedTeam(bytes32 group, bytes4 selector, uint8 team, bool allowed) public virtual onlyDefaultAdmin {
        _allowedTeams[group][selector] = _setTeam(_allowedTeams[group][selector], team, allowed);
        emit TeamAllowed(group, selector, team, allowed);
    }

    function getContractGroup(address target) public view virtual returns (bytes32) {
        return _contractGroup[target];
    }

    function setContractGroup(address target, bytes32 group) public virtual onlyDefaultAdmin {
        require(!_isSpecialGroup(group));
        _contractGroup[target] = group;
        emit ContractGroupUpdated(target, group);
    }

    function setContractOpen(address target) public virtual onlyDefaultAdmin {
        bytes32 group = _GROUP_OPEN;
        _contractGroup[target] = group;
        emit ContractGroupUpdated(target, group);
    }

    function setContractClosed(address target) public virtual onlyDefaultAdmin {
        bytes32 group = _GROUP_CLOSED;
        _contractGroup[target] = group;
        emit ContractGroupUpdated(target, group);
    }

    function _grantRole(bytes32 role, address user) internal virtual override {
        super._grantRole(role, user);
        (bool isTeam, uint8 team) = _decodeTeamRole(role);
        if (isTeam) {
            require(_teamExists(team));
            _userTeams[user] = _setTeam(_userTeams[user], team, true);
        }
    }

    function _revokeRole(bytes32 role, address user) internal virtual override {
        super._revokeRole(role, user);
        (bool isTeam, uint8 team) = _decodeTeamRole(role);
        if (isTeam) {
            require(_teamExists(team));
            require(team != _TEAM_ALL);
            _userTeams[user] = _setTeam(_userTeams[user], team, false);
        }
    }

    function _encodeTeamRole(uint8 role) internal virtual returns (bytes32) {
        return bytes32("team:") | bytes32(uint256(role));
    }

    function _decodeTeamRole(bytes32 role) internal virtual returns (bool, uint8) {
        bytes32 tagMask = hex"ffffffff";
        bytes32 teamMask = hex"ff";
        bool isTeam = (role & tagMask) == bytes32("team:");
        uint8 team = uint8(uint256(role & teamMask));
        return (isTeam, team);
    }

    function _isSpecialGroup(bytes32 group) private pure returns (bool) {
        return group == _GROUP_OPEN || group == _GROUP_CLOSED;
    }

    function _teamMask(uint8 team) private pure returns (bytes32) {
        return bytes32(1 << team);
    }

    function _getTeam(bytes32 bitmap, uint8 team) private pure returns (bool) {
        return bitmap & _teamMask(team) > 0;
    }

    function _setTeam(bytes32 bitmap, uint8 team, bool value) private pure returns (bytes32) {
        bytes32 mask = _teamMask(team);
        if (value) {
            return bitmap | mask;
        } else {
            return bitmap & ~mask;
        }
    }
}

contract AccessManaged {
    event AuthorityUpdated(IAuthority indexed oldAuthority, IAuthority indexed newAuthority);

    IAuthority private _authority;

    modifier restricted {
        require(_authority.canCall(msg.sender, address(this), msg.sig));
        _;
    }

    constructor(IAuthority initialAuthority) {
        _authority = initialAuthority;
    }

    function authority() public virtual view returns (IAuthority) {
        return _authority;
    }

    function setAuthority(IAuthority newAuthority) public virtual {
        require(msg.sender == address(_authority));
        IAuthority oldAuthority = _authority;
        _authority = newAuthority;
        emit AuthorityUpdated(oldAuthority, newAuthority);
    }
}

contract AccessManagerAdapter {
    using Address for address;

    AccessManager private _manager;

    bytes32 private _DEFAULT_ADMIN_ROLE = 0;

    function relay(address target, bytes memory data) external payable {
        bytes4 sig = bytes4(data);
        require(_manager.canCall(msg.sender, target, sig) || _manager.hasRole(_DEFAULT_ADMIN_ROLE, msg.sender));
        (bool ok, bytes memory result) = target.call{value: msg.value}(data);
        assembly {
            let result_pointer := add(32, result)
            let result_size := mload(result)
            switch ok
            case true {
                return(result_pointer, result_size)
            }
            default {
                revert(result_pointer, result_size)
            }
        }
    }
}
