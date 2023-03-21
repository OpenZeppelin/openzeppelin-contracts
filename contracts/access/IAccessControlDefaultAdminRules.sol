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
     * @dev Emitted when a {defaultAdmin} transfer is started, setting `newAdmin` as the next
     * address to become the {defaultAdmin} by calling {acceptDefaultAdminTransfer} only after `acceptSchedule`
     * passes.
     */
    event DefaultAdminTransferScheduled(address indexed newAdmin, uint48 acceptSchedule);

    /**
     * @dev Emitted when a {pendingDefaultAdmin} is reset if it was never accepted, regardless of its schedule.
     */
    event DefaultAdminTransferCanceled();

    /**
     * @dev Emitted when a {defaultAdminDelay} change is started, setting `newDelay` as the next
     * delay to be applied between default admin transfer after `effectSchedule` has passed.
     */
    event DefaultAdminDelayChangeScheduled(uint48 newDelay, uint48 effectSchedule);

    /**
     * @dev Emitted when a {pendingDefaultAdminDelay} is reset if its schedule didn't pass.
     */
    event DefaultAdminDelayChangeCanceled();

    /**
     * @dev Returns the address of the current `DEFAULT_ADMIN_ROLE` holder.
     */
    function defaultAdmin() external view returns (address);

    /**
     * @dev Returns a tuple of `newAdmin` and `schedule`.
     * The former will be the new {defaultAdmin} after the latter passes.
     *
     * A zero value in both indicates there's no pending admin transfer.
     *
     * NOTE: A zero value only for `newAdmin` means that {defaultAdmin} is being renounced.
     */
    function pendingDefaultAdmin() external view returns (address newAdmin, uint48 schedule);

    /**
     * @dev Time in seconds to wait before a delay is increased after calling {changeDefaultAdminDelay}.
     * Default to 5 days.
     *
     * Used whenever {changeDefaultAdminDelay} is called with a `newDelay` higher
     * than the current {defaultAdminDelay}.
     *
     * IMPORTANT: Make sure to add a reasonable amount of time while overriding this value, otherwise,
     * there's a risk of setting a high new delay that goes into effect almost immediately without the
     * possibility of human intervention in the case of an input error (eg. set milliseconds instead of seconds).
     */
    function defaultAdminDelayIncreaseWait() external view returns (uint48);

    /**
     * @dev Returns the delay between each {defaultAdmin} transfer.
     *
     * A scheduled delay change will take effect as soon as the schedule passes, returning the new delay.
     */
    function defaultAdminDelay() external view returns (uint48);

    /**
     * @dev Returns a tuple of `newDelay` and `schedule`.
     * The former will be the new {defaultAdminDelay} after the latter passes.
     *
     * A zero value in both indicates there's no pending delay change.
     *
     * NOTE: A zero value only for `newDelay` means that the next {defaultAdminDelay} will be zero.
     */
    function pendingDefaultAdminDelay() external view returns (uint48 newDelay, uint48 schedule);

    /**
     * @dev Starts a {defaultAdmin} transfer by setting {pendingDefaultAdmin} with a {defaultAdminDelay} schedule.
     *
     * Requirements:
     *
     * - Only can be called by the current {defaultAdmin}.
     *
     * Emits a DefaultAdminRoleChangeStarted event.
     */
    function beginDefaultAdminTransfer(address newAdmin) external;

    /**
     * @dev Completes a {defaultAdmin} transfer.
     *
     * - `DEFAULT_ADMIN_ROLE` should be granted to the caller.
     * - `DEFAULT_ADMIN_ROLE` should be revoked from the previous holder.
     *
     * Requirements:
     *
     * - Only can be called by the {pendingDefaultAdmin}'s `newAdmin` and if its `scheduled` has passed.
     */
    function acceptDefaultAdminTransfer() external;

    /**
     * @dev Cancels a {defaultAdmin} transfer if there was a {pendingDefaultAdmin}.
     *
     * A {pendingDefaultAdmin} not yet accepted can also be cancelled with this function.
     *
     * Requirements:
     *
     * - Only can be called by the current {defaultAdmin}.
     *
     * May emit a DefaultAdminTransferCanceled event.
     */
    function cancelDefaultAdminTransfer() external;

    /**
     * @dev Begins a {defaultAdminDelay} change by scheduling the change in a way in which the
     * current delay is still guaranteed to be respected.
     *
     * The {defaultAdminDelayChangeSchedule} is defined such that `(its schedule + a delayed default admin transfer)`
     * takes at least the current {defaultAdminDelay}, following that:
     *
     * - The schedule is `block.timestamp + (current delay - new delay)` if the delay is reduced.
     * - The schedule is `block.timestamp + {defaultAdminDelayIncreaseWait}` if the delay is increased.
     *
     * A {pendingDefaultAdminDelay} that never got into effect will be canceled in favor of a new scheduled change.
     *
     * Requirements:
     *
     * - Only can be called by the current {defaultAdmin}.
     *
     * Emits a DefaultAdminDelayChangeScheduled event and may emit a DefaultAdminDelayChangeCanceled event.
     */
    function changeDefaultAdminDelay(uint48 newDelay) external;

    /**
     * @dev Cancels a scheduled {defaultAdminDelay} change if its schedule hasn't passed.
     *
     * Requirements:
     *
     * - Only can be called by the current {defaultAdmin}.
     *
     * May emit a DefaultAdminDelayChangeCanceled event.
     */
    function rollbackDefaultAdminDelay() external;
}
