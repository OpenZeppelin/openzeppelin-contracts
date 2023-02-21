// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v4.8.0) (access/AccessControlDefaultAdminRules.sol)

pragma solidity ^0.8.0;

import "./AccessControl.sol";
import "../utils/math/SafeCast.sol";
import "../interfaces/IERC5313.sol";

/**
 * @dev Extension of {AccessControl} that allows specifying special rules to manage
 * the `DEFAULT_ADMIN_ROLE` holder, which is a sensitive role with special permissions
 * over other roles that may potentially have privileged rights in the system.
 *
 * If a specific role doesn't have an `adminRole` assigned, the holder of the
 * `DEFAULT_ADMIN_ROLE` will have the ability to manage it, as determined by the
 * function {getRoleAdmin}'s default value (`address(0)`).
 *
 * This contract implements the following risk mitigations on top of the {AccessControl} implementation:
 *
 * * Only one account holds the `DEFAULT_ADMIN_ROLE` at every time after construction except when it's renounced.
 * * Enforce a 2-step process to transfer the `DEFAULT_ADMIN_ROLE` to another account.
 * * Enforce a configurable delay between the two steps, with the ability to cancel in between.
 *   - Even after the timer has passed to avoid locking it forever.
 * * It is not possible to use another role to manage the `DEFAULT_ADMIN_ROLE`.
 *
 * Example usage:
 *
 * ```solidity
 * contract MyToken is AccessControlDefaultAdminRules {
 *   constructor() AccessControlDefaultAdminRules(
 *     3 days,
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
abstract contract AccessControlDefaultAdminRules is IERC5313, AccessControl {
    uint48 private immutable _delay;

    address private _currentDefaultAdmin;
    address private _pendingDefaultAdmin;

    uint48 private _defaultAdminTransferDelayedUntil;

    /**
     * @dev Emitted when a `DEFAULT_ADMIN_ROLE` transfer is started, setting `newDefaultAdmin`
     * as the next default admin, which will have rights to claim the `DEFAULT_ADMIN_ROLE`
     * after `defaultAdminTransferDelayedUntil` is met.
     */
    event DefaultAdminRoleChangeStarted(address indexed newDefaultAdmin, uint48 defaultAdminTransferDelayedUntil);

    /**
     * @dev Sets the initial values for {delay} in seconds and {defaultAdmin}.
     *
     * The `delay` value is immutable. It can only be set at the constructor.
     */
    constructor(uint48 delay_, address initialDefaultAdmin) {
        _delay = delay_;
        _grantRole(DEFAULT_ADMIN_ROLE, initialDefaultAdmin);
    }

    /**
     * @dev Returns the delay between each `DEFAULT_ADMIN_ROLE` transfer.
     */
    function delay() public view virtual returns (uint48) {
        return _delay;
    }

    /**
     * @dev See {IERC5313-owner}.
     */
    function owner() public view virtual returns (address) {
        return defaultAdmin();
    }

    /**
     * @dev Returns the address of the current `DEFAULT_ADMIN_ROLE` holder.
     */
    function defaultAdmin() public view virtual returns (address) {
        return _currentDefaultAdmin;
    }

    /**
     * @dev Returns the address of the pending `DEFAULT_ADMIN_ROLE` holder.
     */
    function pendingDefaultAdmin() public view virtual returns (address) {
        return _pendingDefaultAdmin;
    }

    /**
     * @dev Returns the timestamp after which the pending default admin can claim the `DEFAULT_ADMIN_ROLE`.
     */
    function defaultAdminTransferDelayedUntil() public view virtual returns (uint48) {
        return _defaultAdminTransferDelayedUntil;
    }

    /**
     * @dev See {IERC165-supportsInterface}.
     */
    function supportsInterface(bytes4 interfaceId) public view virtual override returns (bool) {
        return
            interfaceId == 0x4a02b518 || // type(IAccessControlDefaultAdminRules).interfaceId
            super.supportsInterface(interfaceId);
    }

    /**
     * @dev Starts a `DEFAULT_ADMIN_ROLE` transfer by setting a pending default admin
     * and a timer to be met.
     *
     * Requirements:
     *
     * - Only can be called by the current `DEFAULT_ADMIN_ROLE` holder.
     *
     * Emits a {DefaultAdminRoleChangeStarted}.
     */
    function beginDefaultAdminTransfer(address newAdmin) public virtual onlyRole(DEFAULT_ADMIN_ROLE) {
        _defaultAdminTransferDelayedUntil = SafeCast.toUint48(block.timestamp) + _delay;
        _pendingDefaultAdmin = newAdmin;
        emit DefaultAdminRoleChangeStarted(pendingDefaultAdmin(), defaultAdminTransferDelayedUntil());
    }

    /**
     * @dev Completes a `DEFAULT_ADMIN_ROLE` transfer.
     *
     * Requirements:
     *
     * - Caller should be the pending default admin.
     * - `DEFAULT_ADMIN_ROLE` should be granted to the caller.
     * - `DEFAULT_ADMIN_ROLE` should be revoked from the previous holder.
     */
    function acceptDefaultAdminTransfer() public virtual {
        address pendingDefaultAdminHolder = pendingDefaultAdmin();
        require(
            _hasDefaultAdminTransferDelayPassed() && _msgSender() == pendingDefaultAdminHolder,
            "AccessControl: can't accept defaultAdmin"
        );
        _revokeRole(DEFAULT_ADMIN_ROLE, defaultAdmin());
        _grantRole(DEFAULT_ADMIN_ROLE, pendingDefaultAdminHolder);
        _resetDefaultAdminTransfer();
    }

    /**
     * @dev Cancels a `DEFAULT_ADMIN_ROLE` transfer.
     *
     * Requirements:
     *
     * - Can be called even after the timer is met.
     * - Can only be called by the current `DEFAULT_ADMIN_ROLE` holder.
     */
    function cancelDefaultAdminTransfer() public virtual onlyRole(DEFAULT_ADMIN_ROLE) {
        _resetDefaultAdminTransfer();
    }

    /**
     * @dev Revokes `role` from the calling account.
     *
     * For `DEFAULT_ADMIN_ROLE`, only allows renouncing in two steps, so it's required
     * that the {defaultAdminTransferDelayedUntil} is met and the pending default admin is the zero address.
     * After its execution, it will not be possible to call `onlyRole(DEFAULT_ADMIN_ROLE)`
     * functions.
     *
     * For other roles, see {AccessControl-renounceRole}.
     *
     * NOTE: Renouncing `DEFAULT_ADMIN_ROLE` will leave the contract without a defaultAdmin,
     * thereby disabling any functionality that is only available to the default admin, and the
     * possibility of reassigning a non-administrated role.
     */
    function renounceRole(bytes32 role, address account) public virtual override {
        if (role == DEFAULT_ADMIN_ROLE) {
            require(
                pendingDefaultAdmin() == address(0) && _hasDefaultAdminTransferDelayPassed(),
                "AccessControl: only can renounce in two delayed steps"
            );
        }
        super.renounceRole(role, account);
    }

    /**
     * @dev See {AccessControl-grantRole}. Reverts for `DEFAULT_ADMIN_ROLE`.
     */
    function grantRole(bytes32 role, address account) public virtual override {
        require(role != DEFAULT_ADMIN_ROLE, "AccessControl: can't directly grant defaultAdmin role");
        super.grantRole(role, account);
    }

    /**
     * @dev See {AccessControl-revokeRole}. Reverts for `DEFAULT_ADMIN_ROLE`.
     */
    function revokeRole(bytes32 role, address account) public virtual override {
        require(role != DEFAULT_ADMIN_ROLE, "AccessControl: can't directly revoke defaultAdmin role");
        super.revokeRole(role, account);
    }

    /**
     * @dev See {AccessControl-_setRoleAdmin}. Reverts for `DEFAULT_ADMIN_ROLE`.
     */
    function _setRoleAdmin(bytes32 role, bytes32 adminRole) internal virtual override {
        require(role != DEFAULT_ADMIN_ROLE, "AccessControl: can't violate defaultAdmin rules");
        super._setRoleAdmin(role, adminRole);
    }

    /**
     * @dev Grants `role` to `account`.
     *
     * For `DEFAULT_ADMIN_ROLE`, it only allows granting if there isn't already a role's holder
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
            require(defaultAdmin() == address(0), "AccessControl: defaultAdmin already granted");
            _currentDefaultAdmin = account;
        }
        super._grantRole(role, account);
    }

    /**
     * @dev See {AccessControl-_revokeRole}.
     */
    function _revokeRole(bytes32 role, address account) internal virtual override {
        if (role == DEFAULT_ADMIN_ROLE) {
            delete _currentDefaultAdmin;
        }
        super._revokeRole(role, account);
    }

    /**
     * @dev Resets the pending default admin and delayed until.
     */
    function _resetDefaultAdminTransfer() private {
        delete _pendingDefaultAdmin;
        delete _defaultAdminTransferDelayedUntil;
    }

    /**
     * @dev Checks if a {defaultAdminTransferDelayedUntil} has been set and met.
     */
    function _hasDefaultAdminTransferDelayPassed() private view returns (bool) {
        uint48 defaultAdminTransferDelayedUntilTimestamp = defaultAdminTransferDelayedUntil();
        return
            defaultAdminTransferDelayedUntilTimestamp > 0 &&
            defaultAdminTransferDelayedUntilTimestamp < block.timestamp;
    }
}
