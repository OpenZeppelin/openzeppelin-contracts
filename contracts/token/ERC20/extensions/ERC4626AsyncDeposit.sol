// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {ERC4626} from "./ERC4626.sol";
import {Math} from "../../../utils/math/Math.sol";
import {IERC20} from "../ERC20.sol";

/**
 * @dev Extension of {ERC4626} that supports asynchronous deposit flows.
 *
 * This extension implements a time-based delay mechanism for deposits where assets are queued and become
 * gradually available for deposit over a configurable delay period. This provides protection against
 * various forms of economic attacks and allows for controlled capital inflows.
 *
 * The async deposit mechanism works as follows:
 * 1. Users queue assets using {queueDeposit} or {queueMint}
 * 2. Queued assets become gradually available for deposit over time according to {depositDelay}
 * 3. Users call standard {deposit} or {mint} functions to claim available shares
 *
 * The availability schedule is linear: if a user queues assets at time T with delay D, then at time T+x,
 * the fraction x/D of the queued assets will be available for deposit, up to a maximum of all queued assets
 * when x >= D.
 *
 * Multiple queued deposits are tracked using a weighted average timestamp to ensure fair treatment of
 * deposits made at different times.
 *
 * [CAUTION]
 * ====
 * This extension modifies the behavior of {maxDeposit} and {maxMint} to respect the async schedule.
 * The {deposit} and {mint} functions will revert if called with amounts exceeding the currently available
 * queued assets, even if the user has sufficient balance and the vault would normally accept the deposit.
 * ====
 */
abstract contract ERC4626AsyncDeposit is ERC4626 {
    /**
     * @dev Mapping from owner to the weighted average timestamp of their queued assets.
     * This timestamp represents the "center of mass" of all queued deposits over time.
     */
    mapping(address owner => uint48) private _averageQueueTimepoint;

    /**
     * @dev Mapping from owner to the total amount of assets they have queued for deposit.
     */
    mapping(address owner => uint256) private _queuedAssets;

    /**
     * @dev Emitted when assets are queued for asynchronous deposit.
     */
    event DepositQueued(address indexed owner, uint256 assets);

    /**
     * @dev Returns the delay period for deposits. Assets queued at time T will be fully available
     * for deposit at time T + depositDelay(owner).
     *
     * The default implementation returns 1 day for all users. Override this function to implement
     * custom delay logic, such as different delays for different users or dynamic delays based on
     * market conditions.
     */
    function depositDelay(address /* owner */) public view virtual returns (uint256) {
        return 1 days;
    }

    // ==== Deposit ====

    /**
     * @dev Returns the maximum amount of the underlying asset that can be deposited into the vault for the `owner`,
     * through a {deposit} call.
     *
     * This function considers both the standard ERC4626 deposit limits and the async deposit schedule.
     * The returned value is the minimum of:
     * - The standard {maxDeposit} limit
     * - The amount of queued assets currently available according to the deposit schedule
     */
    function maxDeposit(address owner) public view virtual override returns (uint256) {
        return Math.min(super.maxDeposit(owner), _depositSchedule(_queuedAssets[owner], owner));
    }

    /**
     * @dev Queue assets for asynchronous deposit.
     *
     * The queued assets will become gradually available for deposit over the period specified by {depositDelay}.
     * Multiple calls to this function will update the weighted average timestamp of all queued assets.
     *
     * Requirements:
     * - The caller must have sufficient balance of the underlying asset
     * - The total queued assets cannot exceed the caller's balance
     *
     * Emits a {DepositQueued} event.
     */
    function queueDeposit(uint256 assets, address owner) public virtual {
        _queueAssets(assets, owner);
    }

    /**
     * @dev Deposits assets to the vault and mints shares to receiver.
     *
     * This function will consume from the caller's queued assets. The amount must not exceed
     * the currently available queued assets as determined by the deposit schedule.
     *
     * Requirements:
     * - All standard ERC4626 {deposit} requirements
     * - The caller must have sufficient queued assets available according to the schedule
     */
    function deposit(uint256 assets, address receiver) public virtual override returns (uint256) {
        _queuedAssets[_msgSender()] -= assets;
        return super.deposit(assets, receiver);
    }

    // ==== Mint ====

    /**
     * @dev Returns the maximum amount of shares that can be minted from the vault for the `owner`,
     * through a {mint} call.
     *
     * This function considers both the standard ERC4626 mint limits and the async deposit schedule.
     * The returned value is the minimum of:
     * - The standard {maxMint} limit
     * - The amount of shares that can be minted with currently available queued assets
     */
    function maxMint(address owner) public view virtual override returns (uint256) {
        return Math.min(super.maxMint(owner), _depositSchedule(_queuedAssets[owner], owner));
    }

    /**
     * @dev Queue assets for asynchronous minting of specific share amount.
     *
     * This function calculates the required assets using {previewMint} and queues them.
     * The queued assets will become gradually available for minting over the period specified by {depositDelay}.
     *
     * Requirements:
     * - The caller must have sufficient balance to cover the required assets for minting `shares`
     * - The total queued assets cannot exceed the caller's balance
     *
     * Emits a {DepositQueued} event.
     */
    function queueMint(uint256 shares, address owner) public virtual {
        _queueAssets(previewMint(shares), owner);
    }

    /**
     * @dev Mints exactly `shares` vault shares to `receiver` by consuming queued assets.
     *
     * This function will consume from the caller's queued assets. The required assets must not exceed
     * the currently available queued assets as determined by the deposit schedule.
     *
     * Requirements:
     * - All standard ERC4626 {mint} requirements
     * - The caller must have sufficient queued assets available to cover the required assets for minting
     */
    function mint(uint256 shares, address receiver) public virtual override returns (uint256) {
        uint256 minted = super.mint(shares, receiver);
        _queuedAssets[_msgSender()] -= minted;
        return minted;
    }

    // ==== Internal ====

    /**
     * @dev Internal function to queue assets for async deposit.
     *
     * This function updates the queued assets amount and recalculates the weighted average timestamp.
     * The new average timestamp gives proportional weight to existing queued assets and newly queued assets
     * based on their amounts.
     *
     * The queued amount is capped at the owner's current balance of the underlying asset to prevent
     * queueing more assets than the user actually possesses.
     */
    function _queueAssets(uint256 assets, address owner) internal virtual {
        uint256 queuedAssets = _queuedAssets[owner];
        uint256 newQueuedAssets = Math.min(queuedAssets + assets, IERC20(asset()).balanceOf(owner));
        uint256 previousAverageTimestamp = _averageQueueTimepoint[owner];

        // Safe down cast as timestamp fits in uint48
        _averageQueueTimepoint[owner] = uint48(
            Math.mulDiv(previousAverageTimestamp, queuedAssets, newQueuedAssets) +
                Math.mulDiv(block.timestamp, assets, newQueuedAssets)
        );

        emit DepositQueued(owner, assets);
    }

    /**
     * @dev Internal function to calculate the current deposit schedule for queued assets.
     *
     * Returns the amount of queued assets currently available for deposit based on the time elapsed
     * since the weighted average queue timestamp and the deposit delay period.
     *
     * The calculation is: availableAssets = queuedAssets * min(1, timeElapsed / depositDelay)
     *
     * This provides a linear release schedule where assets become fully available after the delay period.
     */
    function _depositSchedule(uint256 queuedAssets, address owner) internal view virtual returns (uint256) {
        return Math.mulDiv(queuedAssets, block.timestamp - _averageQueueTimepoint[owner], depositDelay(owner));
    }
}
