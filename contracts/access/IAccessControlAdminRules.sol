// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts v4.9.0 (access/IAccessControlAdminRules.sol)

pragma solidity ^0.8.0;

import "./IAccessControl.sol";

/**
 * @dev External interface of AccessControladminRules declared to support ERC165 detection.
 *
 * _Available since v4.9._
 */
interface IAccessControlAdminRules is IAccessControl {
    /**
     * @dev Emitted when an `DEFAULT_ADMIN_ROLE` transfer is started, setting `newAdmin`
     * as the next owner to be claimed after `delayedUntil` is met.
     */
    event AdminRoleChangeStarted(address indexed newAdmin, uint48 delayedUntil);

    /**
     * @dev Returns the address of the current `DEFAULT_ADMIN_ROLE` owner.
     */
    function admin() external view returns (address);

    /**
     * @dev Returns the timestamp in which the pending admin can claim the
     * `DEFAULT_ADMIN_ROLE` role.
     */
    function delayedUntil() external view returns (uint48);

    /**
     * @dev Returns the address of the pending `DEFAULT_ADMIN_ROLE` owner.
     */
    function pendingAdmin() external view returns (address);

    /**
     * @dev Starts a `DEFAULT_ADMIN_ROLE` transfer by setting a pending admin and
     * a timer to be met.
     *
     * Requirements:
     *
     * - There shouldn't be another admin transfer in progress. See {cancelAdminTransfer}.
     * - Can only be called by the current `DEFAULT_ADMIN_ROLE` owner.
     *
     * Emits an {AdminRoleChangeStarted}.
     */
    function beginAdminTransfer(address newAdmin) external;

    /**
     * @dev Completes a `DEFAULT_ADMIN_ROLE` transfer.
     *
     * Requirements:
     *
     * - Caller should be the pending admin.
     * - `DEFAULT_ADMIN_ROLE` should be granted to the caller.
     * - `DEFAULT_ADMIN_ROLE` should be revoked from the previous owner.
     * - Should allow to call {beginAdminTransfer} again.
     */
    function acceptAdminTransfer() external;

    /**
     * @dev Cancels a `DEFAULT_ADMIN_ROLE` transfer.
     *
     * Requirements:
     *
     * - Should allow to call {beginAdminTransfer} again.
     * - Can be called even after the timer is met.
     * - Can only be called by the current `DEFAULT_ADMIN_ROLE` owner.
     */
    function cancelAdminTransfer() external;
}
