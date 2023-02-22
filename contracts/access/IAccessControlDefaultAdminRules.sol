// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts v4.9.0 (access/IAccessControlDefaultAdminRules.sol)

pragma solidity ^0.8.0;

import "./IAccessControl.sol";

/**
 * @dev External interface of AccessControlDefaultAdminRules declared to support ERC165 detection.
 *
 * _Available since v4.9._
 */
interface IAccessControlDefaultAdminRules is IAccessControl {
    /**
     * @dev Emitted when a `DEFAULT_ADMIN_ROLE` transfer is started, setting `newDefaultAdmin`
     * as the next default admin, which will have rights to claim the `DEFAULT_ADMIN_ROLE`
     * after `defaultAdminTransferDelayedUntil` has passed.
     */
    event DefaultAdminRoleChangeStarted(address indexed newDefaultAdmin, uint48 defaultAdminTransferDelayedUntil);

    /**
     * @dev Returns the delay between each `DEFAULT_ADMIN_ROLE` transfer.
     */
    function defaultAdminDelay() external view returns (uint48);

    /**
     * @dev Returns the address of the current `DEFAULT_ADMIN_ROLE` holder.
     */
    function defaultAdmin() external view returns (address);

    /**
     * @dev Returns the address of the pending `DEFAULT_ADMIN_ROLE` holder.
     */
    function pendingDefaultAdmin() external view returns (address);

    /**
     * @dev Returns the timestamp after which the pending default admin can claim the `DEFAULT_ADMIN_ROLE`.
     */
    function defaultAdminTransferDelayedUntil() external view returns (uint48);

    /**
     * @dev Starts a `DEFAULT_ADMIN_ROLE` transfer by setting a pending default admin
     * and a timer to pass.
     *
     * Requirements:
     *
     * - Only can be called by the current `DEFAULT_ADMIN_ROLE` holder.
     *
     * Emits a {DefaultAdminRoleChangeStarted}.
     */
    function beginDefaultAdminTransfer(address newAdmin) external;

    /**
     * @dev Completes a `DEFAULT_ADMIN_ROLE` transfer.
     *
     * Requirements:
     *
     * - Caller should be the pending default admin.
     * - `DEFAULT_ADMIN_ROLE` should be granted to the caller.
     * - `DEFAULT_ADMIN_ROLE` should be revoked from the previous holder.
     */
    function acceptDefaultAdminTransfer() external;

    /**
     * @dev Cancels a `DEFAULT_ADMIN_ROLE` transfer.
     *
     * Requirements:
     *
     * - Can be called even after the timer has passed.
     * - Can only be called by the current `DEFAULT_ADMIN_ROLE` holder.
     */
    function cancelDefaultAdminTransfer() external;
}
