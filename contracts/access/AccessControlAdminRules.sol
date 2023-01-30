// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v4.8.0) (access/AccessControlAdminRules.sol)

pragma solidity ^0.8.0;

import "./AccessControl.sol";
import "./IAccessControlAdminRules.sol";
import "../utils/math/SafeCast.sol";
import "../interfaces/draft-IERC5313.sol";

/**
 * @dev Extension of {AccessControl} that allows to specify special rules to manage
 * the `DEFAULT_ADMIN_ROLE` 's owner, which is a sensitive role with special permissions
 * over other valid roles that may potentially have rights.
 *
 * If a specific role doesn't have an `adminRole` assigned, the holder of the
 * `DEFAULT_ADMIN_ROLE` will have the ability to manage it, as determined by the
 * function {getRoleAdmin}'s default value (`address(0)`).
 *
 * This contract implements the following risk mitigations on top of the AccessControl implementation:
 *
 * * Only one account holds the `DEFAULT_ADMIN_ROLE` at every time after construction except when renounced.
 * * Enforce a 2-step process to transfer the `DEFAULT_ADMIN_ROLE` to another account.
 *   - Even when it's been renounced.
 * * Enforce a configurable delay between the two steps, with the ability to cancel in between.
 *   - Even after the timer has passed to avoid locking it forever.
 * * The `DEFAULT_ADMIN_ROLE` 's admin can be only held by itself.
 *
 * Once you understand what the {constructor} parameters are, you can use this reference implementation:
 *
 * ```solidity
 * contract MyToken is AccessControlAdminRules {
 *   constructor() AccessControlAdminRules(
 *     60 * 60 * 24, // 3 days
 *     _msgSender() // Explicit initial `DEFAULT_ADMIN_ROLE` holder
 *    ) {}
 *}
 * ```
 *
 * NOTE: The `delay` is only configurable in the constructor to avoid issues related with handling
 * delay management during the transfer is pending to be completed.
 *
 * _Available since v4.9._
 */
abstract contract AccessControlAdminRules is IAccessControlAdminRules, IERC5313, AccessControl {
    uint48 private immutable _delay;

    address private _currentAdmin;
    address private _pendingAdmin;

    uint48 private _delayedUntil;

    /**
     * @dev Sets the initial values the internal delay and {owner}.
     *
     * The `delay` value is immutable. It can only be set at the constructor.
     */
    constructor(uint48 delay, address initialAdmin) {
        _delay = delay;
        _grantRole(DEFAULT_ADMIN_ROLE, initialAdmin);
    }

    /**
     * @dev See {draft-IERC5313-owner}
     */
    function owner() public view virtual returns (address) {
        return admin();
    }

    /**
     * @dev See {IAccessControlAdminRules-admin}
     */
    function admin() public view virtual returns (address) {
        return _currentAdmin;
    }

    /**
     * @dev See {IAccessControlAdminRules-delayedUntil}
     */
    function delayedUntil() public view virtual returns (uint48) {
        return _delayedUntil;
    }

    /**
     * @dev See {IAccessControlAdminRules-pendingAdmin}
     */
    function pendingAdmin() public view virtual returns (address) {
        return _pendingAdmin;
    }

    /**
     * @dev See {IERC165-supportsInterface}.
     */
    function supportsInterface(bytes4 interfaceId) public view virtual override returns (bool) {
        return interfaceId == type(IAccessControlAdminRules).interfaceId || super.supportsInterface(interfaceId);
    }

    /**
     * @dev See {IAccessControlAdminRules-beginAdminTransfer}
     */
    function beginAdminTransfer(address newAdmin) public virtual override onlyRole(DEFAULT_ADMIN_ROLE) {
        require(delayedUntil() == 0, "AccessControl: pending admin already set");
        _delayedUntil = SafeCast.toUint48(block.timestamp) + _delay;
        _pendingAdmin = newAdmin;
        emit AdminRoleChangeStarted(_pendingAdmin, _delayedUntil);
    }

    /**
     * @dev See {IAccessControlAdminRules-acceptAdminTransfer}
     */
    function acceptAdminTransfer() public virtual {
        address pendingAdminOwner = pendingAdmin();
        require(
            _adminTransferIsUnlocked() && _msgSender() == pendingAdminOwner,
            "AccessControl: delay must be met and caller must be pending admin"
        );
        _revokeRole(DEFAULT_ADMIN_ROLE, admin());
        _grantRole(DEFAULT_ADMIN_ROLE, pendingAdminOwner);
        _resetAdminTransfer();
    }

    /**
     * @dev See {IAccessControlAdminRules-cancelAdminTransfer}
     */
    function cancelAdminTransfer() public virtual onlyRole(DEFAULT_ADMIN_ROLE) {
        _resetAdminTransfer();
    }

    /**
     * @dev Revokes `role` from the calling account.
     *
     * For `DEFAULT_ADMIN_ROLE`, only allows renouncing in two steps, so it's required
     * that the {delayedUntil} is met and the pending admin is the zero address.
     * After its execution, it will not be possible to call `onlyRole(DEFAULT_ADMIN_ROLE)`
     * functions.
     *
     * For other roles, see {AccessControl-renounceRole}.
     *
     * NOTE: Renouncing `DEFAULT_ADMIN_ROLE` will leave the contract without an owner,
     * thereby disabling any functionality that is only available to the default admin, and the
     * possibility of reassigning a non-administrated role.
     */
    function renounceRole(bytes32 role, address account) public virtual override(IAccessControl, AccessControl) {
        if (role == DEFAULT_ADMIN_ROLE) {
            require(
                pendingAdmin() == address(0) && _adminTransferIsUnlocked(),
                "AccessControl: admin can only renounce in two delayed steps"
            );
        }
        super.renounceRole(role, account);
    }

    /**
     * @dev See {AccessControl-grantRole}. Reverts for `DEFAULT_ADMIN_ROLE`.
     */
    function grantRole(
        bytes32 role,
        address account
    ) public virtual override(IAccessControl, AccessControl) onlyRole(getRoleAdmin(role)) {
        require(role != DEFAULT_ADMIN_ROLE, "AccessControl: can't directly grant admin role");
        super.grantRole(role, account);
    }

    /**
     * @dev See {AccessControl-revokeRole}. Reverts for `DEFAULT_ADMIN_ROLE`.
     */
    function revokeRole(
        bytes32 role,
        address account
    ) public virtual override(IAccessControl, AccessControl) onlyRole(getRoleAdmin(role)) {
        require(role != DEFAULT_ADMIN_ROLE, "AccessControl: can't directly revoke admin role");
        super.revokeRole(role, account);
    }

    /**
     * @dev See {AccessControl-_setRoleAdmin}. Reverts for `DEFAULT_ADMIN_ROLE`.
     */
    function _setRoleAdmin(bytes32 role, bytes32 adminRole) internal virtual override {
        require(role != DEFAULT_ADMIN_ROLE, "AccessControl: can't override admin's admin");
        super._setRoleAdmin(role, adminRole);
    }

    /**
     * @dev Grants `role` to `account`.
     *
     * For `DEFAULT_ADMIN_ROLE`, it only allows granting if there isn't already a role's owner
     * or if the role has been previously renounced.
     *
     * For other roles, see {AccessControl-renounceRole}.
     *
     * NOTE: Exposing this function through another mechanism may make the
     * `DEFAULT_ADMIN_ROLE` assignable again. Make sure to guarantee this is
     * the expected behavior in your implementation.
     */
    function _grantRole(bytes32 role, address account) internal virtual override {
        if (role == DEFAULT_ADMIN_ROLE) {
            require(admin() == address(0), "AccessControl: admin already granted");
            _currentAdmin = account;
        }
        super._grantRole(role, account);
    }

    /**
     * @dev See {AccessControl-_revokeRole}.
     */
    function _revokeRole(bytes32 role, address account) internal virtual override {
        if (role == DEFAULT_ADMIN_ROLE) {
            delete _currentAdmin;
        }
        super._revokeRole(role, account);
    }

    /**
     * @dev Resets the pending admin and delayed until.
     */
    function _resetAdminTransfer() private {
        delete _pendingAdmin;
        delete _delayedUntil;
    }

    /**
     * @dev Checks if a {delayedUntil} has been set and met.
     */
    function _adminTransferIsUnlocked() private view returns (bool) {
        uint48 delayedUntilTimestamp = _delayedUntil;
        return delayedUntilTimestamp > 0 && delayedUntilTimestamp < block.timestamp;
    }
}
