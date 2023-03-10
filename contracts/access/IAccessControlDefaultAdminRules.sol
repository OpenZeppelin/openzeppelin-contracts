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
     * @dev Emitted when a {defaultAdminDelay} change is started, setting `newDefaultAdminDelay` as the next
     * delay to be applied between default admin transfer after `defaultAdminDelaySchedule` has passed.
     */
    event DefaultAdminDelayChangeStarted(uint48 indexed newDefaultAdminDelay, uint48 defaultAdminDelaySchedule);

    /**
     * @dev Emitted when a `DEFAULT_ADMIN_ROLE` transfer is started, setting `newDefaultAdmin`
     * as the next default admin, which will have rights to claim the `DEFAULT_ADMIN_ROLE`
     * after {defaultAdminTransferSchedule} has passed.
     */
    event DefaultAdminRoleChangeStarted(address indexed newDefaultAdmin, uint48 defaultAdminTransferSchedule);

    /**
     * @dev Returns the delay between each `DEFAULT_ADMIN_ROLE` transfer.
     *
     * A scheduled delay change will take effect as soon as the schedule passes, returning the new delay.
     */
    function defaultAdminDelay() external view returns (uint48);

    /**
     * @dev Returns the pending delay to be set after {defaultAdminDelayChangeSchedule} passes.
     *
     * A zero value indicates there's no pending delay. This function will return 0 if a previous
     * scheduled delay change has already passed.
     */
    function pendingDefaultAdminDelay() external view returns (uint48);

    /**
     * @dev Returns the timestamp after which {pendingDefaultAdminDelay} becomes {defaultAdminDelay}.
     *
     * The value can be in the past if the scheduled has passed but {beginDefaultAdminDelayChange}
     * hasn't been called.
     *
     * A zero value indicates no delay change scheduled.
     */
    function defaultAdminDelayChangeSchedule() external view returns (uint48);

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
     *
     * A zero value indicates no default admin transfer scheduled.
     */
    function defaultAdminTransferSchedule() external view returns (uint48);

    /**
     * @dev Time in seconds to wait before an increased delay change goes into effect. Default to 5 days.
     *
     * It's used whenever {beginDefaultAdminDelayChange} is called with a `newDefaultAdminDelay` higher
     * than the current {defaultAdminDelay}.
     *
     * IMPORTANT: Make sure to add a reasonable amount of time while overriding this value, otherwise,
     * there's a risk of setting a high new delay that goes into effect almost immediately without the
     * possibility of human intervention in the case of an input error (eg. set milliseconds instead of seconds).
     */
    function increasedDelayWait() external view returns (uint48);

    /**
     * @dev Begins a {defaultAdminDelay} change by scheduling the change in a way in which the
     * current delay is still guaranteed to be respected.
     *
     * The {defaultAdminDelayChangeSchedule} is defined such that the schedule + a default admin transfer
     * takes at least the current {defaultAdminDelay} or {increasedDelayWait}, following that:
     *
     * - The schedule is `block.timestamp + {increasedDelayWait}` if the delay is increased.
     * - The schedule is `block.timestamp + (current delay - new delay)` if the delay is reduced.
     *
     * Requirements:
     *
     * - No default admin transfer should've been started.
     * - No new default admin transfers should happen before the scheduled change passes.
     * - (schedule + new admin transfer) takes at least {defaultAdminDelay} or {increasedDelayWait}.
     * - Only can be called by the current `DEFAULT_ADMIN_ROLE` holder.
     * - Only can be called before another delay change takes effect, or after the scheduled change is reset
     *   by calling {beginDefaultAdminTransfer}.
     *
     * Emits a DefaultAdminDelayChangeStarted event.
     */
    function beginDefaultAdminDelayChange(uint48 newDefaultAdminDelay) external;

    /**
     * @dev Cancels a scheduled {defaultAdminDelay} change.
     *
     * Requirements:
     *
     * - Only can be called by the current `DEFAULT_ADMIN_ROLE` holder.
     * - Only can be called before another delay change takes effect, or after the scheduled change is reset
     *   by calling {beginDefaultAdminTransfer}.
     */
    function cancelDefaultAdminDelayChange() external;

    /**
     * @dev Starts a `DEFAULT_ADMIN_ROLE` transfer by setting a pending default admin
     * and a schedule to pass.
     *
     * Requirements:
     *
     * - Only can be called by the current `DEFAULT_ADMIN_ROLE` holder.
     *
     * Emits a DefaultAdminRoleChangeStarted event.
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
     * - Can be called even after the schedule has passed.
     * - Can only be called by the current `DEFAULT_ADMIN_ROLE` holder.
     */
    function cancelDefaultAdminTransfer() external;
}
