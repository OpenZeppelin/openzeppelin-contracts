pragma solidity ^0.6.0;

import "../utils/EnumerableSet.sol";

/**
 * @dev Contract module that allows children to implement role-based access
 * control mechanisms.
 *
 * Roles are referred to by their `bytes32` identifier. These should be exposed
 * in the external API and be unique. The best way to achieve this is by
 * using `public constant` hash digests:
 *
 * ```
 * bytes32 public constant MY_ROLE = keccak256("MY_ROLE");
 * ```
 *
 * Roles can be used to represent a set of permissions. To restrict access to a
 * function call, use {hasRole}:
 *
 * ```
 * function foo() public {
 *     require(hasRole(MY_ROLE, msg.sender));
 *     ...
 * }
 * ```
 *
 * Roles can be granted and revoked programatically by calling the `internal`
 * {_grantRole} and {_revokeRole} functions.
 *
 * This can also be achieved dynamically via the `external` {grantRole} and
 * {revokeRole} functions. Each role has an associated admin role, and only
 * accounts that have a role's admin role can call {grantRole} and {revokeRoke}.
 *
 * By default, the admin role for all roles is `DEFAULT_ADMIN_ROLE`, which means
 * that only accounts with this role will be able to grant or revoke other
 * roles. More complex role relationships can be created by using
 * {_setRoleAdmin}.
 */
abstract contract AccessControl {
    using EnumerableSet for EnumerableSet.AddressSet;

    struct Role {
        EnumerableSet.AddressSet members;
        bytes32 admin; // This role's admin role
    }

    mapping (bytes32 => Role) private _roles;

    bytes32 public constant DEFAULT_ADMIN_ROLE = 0x00;

    /**
     * @dev Emitted when `account` is granted `roleId` role.
     */
    event RoleGranted(bytes32 indexed roleId, address indexed account);

    /**
     * @dev Emitted when `account` is revoked the `roleId` role.
     */
    event RoleRevoked(bytes32 indexed roleId, address indexed account);

    /**
     * @dev Returns `true` if `account` has the `roleId` role.
     */
    function hasRole(bytes32 roleId, address account) public view returns (bool) {
        return _roles[roleId].members.contains(account);
    }

    /**
     * @dev Returns the number of accounts that have the `roleId` role. Can be
     * used together with {getRoleMember} to enumerate all bearers of a role.
     */
    function getRoleMemberCount(bytes32 roleId) public view returns (uint256) {
        return _roles[roleId].members.length();
    }

    /**
     * @dev Returns one of the accounts that has the `roleId` role. `index` must
     * be a value between 0 and {getRoleMemberCount}, non-inclusive.
     *
     * Role bearers are not sorted in any particular way, and their ordering may
     * change at any point.
     *
     * WARNING: When using {getRoleMember} and {getRoleMemberCount}, make sure
     * you perform all queries on the same block. See the following
     * https://forum.openzeppelin.com/t/iterating-over-elements-on-enumerableset-in-openzeppelin-contracts/2296[forum post]
     * for more information.
     */
    function getRoleMember(bytes32 roleId, uint256 index) public view returns (address) {
        return _roles[roleId].members.get(index);
    }

    /**
     * @dev Returns the role identifier for the admin role that controls
     * `roleId` role. See {grantRole} and {revokeRole}.
     *
     * To change a role's admin, use {_setRoleAdmin}.
     */
    function getRoleAdmin(bytes32 roleId) external view returns (bytes32) {
        return _roles[roleId].admin;
    }

    /**
     * @dev Grants the `roleId` role to `account`.
     *
     * Calls {_grantRole} internally.
     *
     * Requirements:
     *
     * - the caller must have `roleId`'s admin role.
     */
    function grantRole(bytes32 roleId, address account) external virtual {
        require(hasRole(_roles[roleId].admin, msg.sender), "AccessControl: sender must be an admin to grant");

        _grantRole(roleId, account);
    }

    /**
     * @dev Revokes the `roleId` role from `account`.
     *
     * Calls {_revokeRole} internally.
     *
     * Requirements:
     *
     * - the caller must have `roleId`'s admin role.
     */
    function revokeRole(bytes32 roleId, address account) external virtual {
        require(hasRole(_roles[roleId].admin, msg.sender), "AccessControl: sender must be an admin to revoke");

        _revokeRole(roleId, account);
    }

    /**
     * @dev Revokes a role from calling account.
     *
     * Roles are often managed via {grantRole} and {revokeRole}: this function's
     * purpose is to provide a mechanism for accounts to lose their privileges
     * if they are compromised (such as when a trusted device is misplaced).
     *
     * Requirements:
     *
     * - the caller must be `account`.
     */
    function renounceRole(bytes32 roleId, address account) external virtual {
        require(account == msg.sender, "AccessControl: can only renounce roles for self");

        _revokeRole(roleId, account);
    }

    /**
     * @dev Grants the `roleId` role to `account`.
     *
     * Emits a {RoleGranted} event.
     */
    function _grantRole(bytes32 roleId, address account) internal virtual {
        _roles[roleId].members.add(account);

        emit RoleGranted(roleId, account);
    }

    /**
     * @dev Revokes the `roleId` role from `account`.
     *
     * Emits a {RoleRevoked} event.
     */
    function _revokeRole(bytes32 roleId, address account) internal virtual {
        _roles[roleId].members.remove(account);

        emit RoleRevoked(roleId, account);
    }

    /**
     * @dev Sets `adminRoleId` as `roleId` role's admin role.
     */
    function _setRoleAdmin(bytes32 roleId, bytes32 adminRoleId) internal virtual {
        _roles[roleId].admin = adminRoleId;
    }
}
