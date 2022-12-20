// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./AccessControl.sol";

/**
 * @dev Contract module that allows children to implement role-based access
 * control mechanisms. This is a lightweight version that doesn't allow enumerating role
 * members except through off-chain means by accessing the contract event logs. Some
 * applications may benefit from on-chain enumerability, for those cases see
 * {AccessControlEnumerable}.
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
 * Roles can be granted and revoked dynamically via the {grantRole} and
 * {revokeRole} functions. Each role has an associated admin role, and only
 * accounts that have a role's admin role can call {grantRole} and {revokeRole}.
 *
 * Roles can be transferred dynamically via the {transferAccess} and
 * {grantAccessTransfer} functions. An event is emitted for the role admin hash of the
 * particular role and who so ever is the admin of the role can revoke the access
 * from the user who initiated this transaction and grant it to other given address
 *
 * By default, the admin role for all roles is `DEFAULT_ADMIN_ROLE`, which means
 * that only accounts with this role will be able to grant or revoke other
 * roles. More complex role relationships can be created by using
 * {_setRoleAdmin}.
 *
 * WARNING: The `DEFAULT_ADMIN_ROLE` is also its own admin: it has permission to
 * grant and revoke this role. Extra precautions should be taken to secure
 * accounts that have been granted it.
 */
abstract contract AccessControl2Step is AccessControl {
    mapping(address => mapping(bytes32 => address)) private _pendingAccess;

    event AccessTransferStarted(address indexed previousUser, address indexed newUser, bytes32 role);

    /**
     * @dev Returns the address of the pending user to which access will be granted.
     */
    function pendingAccess(address user, bytes32 role) public view virtual returns (address) {
        return _pendingAccess[user][role];
    }

    /**
     * @dev Starts the access transfer to a new account. Replaces the pending transfer if there is one.
     * Can only be called by the user who has the given role access.
     */
    function transferAccess(bytes32 role, address newUser) external virtual onlyRole(role) {
        _pendingAccess[_msgSender()][role] = newUser;
        emit AccessTransferStarted(_msgSender(), newUser, role);
    }

    /**
     * @dev Revokes `role` from `account` and delete
     * any pending access for given role and account.
     *
     * Internal function without access restriction.
     *
     * May emit a {RoleRevoked} event.
     */
    function _revokeRole(bytes32 role, address account) internal virtual override {
        delete _pendingAccess[account][role];
        super._revokeRole(role, account);
    }

    /**
     * @dev Only the user who has the access of roleAdmin
     * role for the given role can call this function .
     */
    function grantAccessTransfer(address oldUser, bytes32 role) external onlyRole(getRoleAdmin(role)) {
        address newUser = _pendingAccess[oldUser][role];
        require(newUser != address(0), "AccessControl2Step: no pending user for given user and role");
        _revokeRole(role, oldUser);
        super._grantRole(role, newUser);
    }
}
