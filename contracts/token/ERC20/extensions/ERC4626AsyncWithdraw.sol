// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {ERC4626} from "./ERC4626.sol";
import {Math} from "../../../utils/math/Math.sol";
import {IERC20} from "../ERC20.sol";

/**
 * @dev Extension of {ERC4626} that supports asynchronous withdrawal flows.
 *
 * This extension implements a time-based delay mechanism for withdrawals where shares are queued and become
 * gradually available for redemption over a configurable delay period. This provides protection against
 * bank runs and allows for controlled capital outflows.
 *
 * The async withdrawal mechanism works as follows:
 * 1. Users queue shares for withdrawal using {queueRedeem} or {queueWithdraw}
 * 2. Queued shares become gradually available for redemption over time according to {withdrawDelay}
 * 3. Users call standard {redeem} or {withdraw} functions to claim available assets
 *
 * The availability schedule is linear: if a user queues shares at time T with delay D, then at time T+x,
 * the fraction x/D of the queued shares will be available for withdrawal, up to a maximum of all queued shares
 * when x >= D.
 *
 * Multiple queued withdrawals are tracked using a weighted average timestamp to ensure fair treatment of
 * withdrawal requests made at different times.
 *
 * [CAUTION]
 * ====
 * This extension modifies the behavior of {maxWithdraw} and {maxRedeem} to respect the async schedule.
 * The {withdraw} and {redeem} functions will revert if called with amounts exceeding the currently available
 * queued shares, even if the user has sufficient share balance and the vault would normally allow the withdrawal.
 * ====
 */
abstract contract ERC4626AsyncWithdraw is ERC4626 {
    /**
     * @dev Mapping from owner to the weighted average timestamp of their queued shares.
     * This timestamp represents the "center of mass" of all queued withdrawal requests over time.
     */
    mapping(address owner => uint48) private _averageQueueTimepoint;

    /**
     * @dev Mapping from owner to the total amount of shares they have queued for withdrawal.
     */
    mapping(address owner => uint256) private _queuedShares;

    /**
     * @dev Emitted when shares are queued for asynchronous withdrawal.
     */
    event WithdrawQueued(address indexed owner, uint256 shares);

    /**
     * @dev Returns the delay period for withdrawals. Shares queued at time T will be fully available
     * for withdrawal at time T + withdrawDelay(owner).
     *
     * The default implementation returns 1 day for all users. Override this function to implement
     * custom delay logic, such as different delays for different users or dynamic delays based on
     * market conditions or liquidity requirements.
     */
    function withdrawDelay(address /* owner */) public view virtual returns (uint256) {
        return 1 days;
    }

    // ==== Redeem ====

    /**
     * @dev Returns the maximum amount of shares that can be redeemed from the `owner` balance in the vault,
     * through a {redeem} call.
     *
     * This function considers both the standard ERC4626 redemption limits and the async withdrawal schedule.
     * The returned value is the minimum of:
     * - The standard {maxRedeem} limit
     * - The amount of queued shares currently available according to the withdrawal schedule
     */
    function maxRedeem(address owner) public view virtual override returns (uint256) {
        return Math.min(super.maxRedeem(owner), _withdrawSchedule(_queuedShares[owner], owner));
    }

    /**
     * @dev Queue shares for asynchronous redemption.
     *
     * The queued shares will become gradually available for redemption over the period specified by {withdrawDelay}.
     * Multiple calls to this function will update the weighted average timestamp of all queued shares.
     *
     * Requirements:
     * - The caller must have sufficient share balance
     * - The total queued shares cannot exceed the caller's share balance
     *
     * Emits a {WithdrawQueued} event.
     */
    function queueRedeem(uint256 shares, address owner) public virtual {
        _queueShares(shares, owner);
    }

    /**
     * @dev Burns exactly `shares` from `owner` and sends assets of underlying tokens to `receiver`.
     *
     * This function will consume from the owner's queued shares. The amount must not exceed
     * the currently available queued shares as determined by the withdrawal schedule.
     *
     * Requirements:
     * - All standard ERC4626 {redeem} requirements
     * - The owner must have sufficient queued shares available according to the schedule
     */
    function redeem(uint256 shares, address receiver, address owner) public virtual override returns (uint256) {
        _queuedShares[owner] -= shares;
        return super.redeem(shares, receiver, owner);
    }

    // ==== Withdraw ====

    /**
     * @dev Returns the maximum amount of the underlying asset that can be withdrawn from the `owner` balance
     * in the vault, through a {withdraw} call.
     *
     * This function considers both the standard ERC4626 withdrawal limits and the async withdrawal schedule.
     * The returned value is the minimum of:
     * - The standard {maxWithdraw} limit
     * - The amount of assets that can be withdrawn with currently available queued shares
     */
    function maxWithdraw(address owner) public view virtual override returns (uint256) {
        return Math.min(super.maxWithdraw(owner), _withdrawSchedule(_queuedShares[owner], owner));
    }

    /**
     * @dev Queue shares for asynchronous withdrawal of specific asset amount.
     *
     * This function calculates the required shares using {previewWithdraw} and queues them.
     * The queued shares will become gradually available for withdrawal over the period specified by {withdrawDelay}.
     *
     * Requirements:
     * - The caller must have sufficient share balance to cover the required shares for withdrawing `assets`
     * - The total queued shares cannot exceed the caller's share balance
     *
     * Emits a {WithdrawQueued} event.
     */
    function queueWithdraw(uint256 assets, address owner) public virtual {
        _queueShares(previewWithdraw(assets), owner);
    }

    /**
     * @dev Burns shares from `owner` and sends exactly `assets` of underlying tokens to `receiver`.
     *
     * This function will consume from the owner's queued shares. The required shares must not exceed
     * the currently available queued shares as determined by the withdrawal schedule.
     *
     * Requirements:
     * - All standard ERC4626 {withdraw} requirements
     * - The owner must have sufficient queued shares available to cover the required shares for withdrawal
     */
    function withdraw(uint256 assets, address receiver, address owner) public virtual override returns (uint256) {
        uint256 withdrawn = super.withdraw(assets, receiver, owner);
        _queuedShares[owner] -= withdrawn;
        return withdrawn;
    }

    // ==== Internal ====

    /**
     * @dev Internal function to queue shares for async withdrawal.
     *
     * This function updates the queued shares amount and recalculates the weighted average timestamp.
     * The new average timestamp gives proportional weight to existing queued shares and newly queued shares
     * based on their amounts.
     *
     * The queued amount is capped at the owner's current share balance to prevent queueing more shares
     * than the user actually possesses.
     */
    function _queueShares(uint256 shares, address owner) internal virtual {
        uint256 queuedShares = _queuedShares[owner];
        uint256 newQueuedShares = Math.min(queuedShares + shares, balanceOf(owner));
        uint256 previousAverageTimestamp = _averageQueueTimepoint[owner];

        // Safe down cast as timestamp fits in uint48
        _averageQueueTimepoint[owner] = uint48(
            Math.mulDiv(previousAverageTimestamp, queuedShares, newQueuedShares) +
                Math.mulDiv(block.timestamp, shares, newQueuedShares)
        );

        emit WithdrawQueued(owner, shares);
    }

    /**
     * @dev Internal function to calculate the current withdrawal schedule for queued shares.
     *
     * Returns the amount of queued shares currently available for withdrawal based on the time elapsed
     * since the weighted average queue timestamp and the withdrawal delay period.
     *
     * The calculation is: availableShares = queuedShares * min(1, timeElapsed / withdrawDelay)
     *
     * This provides a linear release schedule where shares become fully available after the delay period.
     */
    function _withdrawSchedule(uint256 queuedShares, address owner) internal view virtual returns (uint256) {
        return Math.mulDiv(queuedShares, block.timestamp - _averageQueueTimepoint[owner], withdrawDelay(owner));
    }
}
