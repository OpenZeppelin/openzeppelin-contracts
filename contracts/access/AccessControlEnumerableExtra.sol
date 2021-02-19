// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./AccessControl.sol";
import "../utils/structs/EnumerableSet.sol";

/**
 * @dev External interface of AccessControlEnumerable declared to support ERC165 detection.
 */
interface IAccessControlEnumerableExtra {
    function getAddressRole(address account, uint256 index) external view returns (bytes32);
    function getAddressRoleCount(address account) external view returns (uint256);
}

/**
 * @dev Extension of {AccessControl} that allows enumerating the roles of each member.
 */
abstract contract AccessControlEnumerableExtra is IAccessControlEnumerableExtra, AccessControl {
    using EnumerableSet for EnumerableSet.Bytes32Set;

    mapping (address => EnumerableSet.Bytes32Set) private _addressRoles;

    /**
     * @dev See {IERC165-supportsInterface}.
     */
    function supportsInterface(bytes4 interfaceId) public view virtual override returns (bool) {
        return interfaceId == type(IAccessControlEnumerableExtra).interfaceId
            || super.supportsInterface(interfaceId);
    }

    /**
     * @dev Returns one of the roles that `account` has. `index` must be a
     * value between 0 and {getAddressRoleCount}, non-inclusive.
     *
     * Role not sorted in any particular way, and their ordering may change at
     * any point.
     *
     * WARNING: When using {getAddressRole} and {getAddressRoleCount}, make sure
     * you perform all queries on the same block. See the following
     * https://forum.openzeppelin.com/t/iterating-over-elements-on-enumerableset-in-openzeppelin-contracts/2296[forum post]
     * for more information.
     */
    function getAddressRole(address account, uint256 index) public view override returns (bytes32) {
        return _addressRoles[account].at(index);
    }

    /**
     * @dev Returns the number of role that `account` has. Can be used
     * together with {getAddressRole} to enumerate all role of an account.
     */
    function getAddressRoleCount(address account) public view override returns (uint256) {
        return _addressRoles[account].length();
    }

    /**
     * @dev Overload {grantRole} to track enumerable memberships
     */
    function grantRole(bytes32 role, address account) public virtual override {
        super.grantRole(role, account);
        _addressRoles[account].add(role);
    }

    /**
     * @dev Overload {revokeRole} to track enumerable memberships
     */
    function revokeRole(bytes32 role, address account) public virtual override {
        super.revokeRole(role, account);
        _addressRoles[account].remove(role);
    }

    /**
     * @dev Overload {revokeRole} to track enumerable memberships
     */
    function renounceRole(bytes32 role, address account) public virtual override {
        super.renounceRole(role, account);
        _addressRoles[account].remove(role);
    }

    /**
     * @dev Overload {_setupRole} to track enumerable memberships
     */
    function _setupRole(bytes32 role, address account) internal virtual override {
        super._setupRole(role, account);
        _addressRoles[account].add(role);
    }
}
