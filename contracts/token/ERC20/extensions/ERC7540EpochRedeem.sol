// SPDX-License-Identifier: MIT

pragma solidity ^0.8.31;

import {Math} from "../../../utils/math/Math.sol";
import {SafeCast} from "../../../utils/math/SafeCast.sol";
import {DoubleEndedQueue} from "../../../utils/structs/DoubleEndedQueue.sol";
import {ERC7540} from "./ERC7540.sol";

/**
 * @dev Epoch-based batch fulfillment strategy for asynchronous redemptions.
 *
 * Extends {ERC7540} with a redeem flow where requests submitted during the same epoch are batched
 * together and settled at a single exchange rate when the admin closes the epoch via {_fulfillRedeem}.
 * All controllers within a fulfilled epoch receive the same pro-rata conversion from shares to assets.
 *
 * Production equivalents:
 * https://github.com/Storm-Labs-Inc/cove-contracts-core/blob/master/src/BasketToken.sol[Cove],
 * https://github.com/AmphorProtocol/asynchronous-vault/tree/main[Amphor],
 * https://github.com/hopperlabsxyz/lagoon-v0/blob/main/src/v0.5.0/ERC7540.sol[Lagoon].
 *
 * The `requestId` returned by {requestRedeem} is the epoch ID. By default, epochs are weekly
 * and start on Mondays (`(block.timestamp + 3 days) / 1 weeks`); override {currentRedeemEpoch} to change
 * the cadence or use manually-bumped epoch counters.
 *
 * Each account tracks its epoch memberships via a {DoubleEndedQueue} capped at
 * {_redeemRequestQueueLimit} entries (default: 32) to bound the O(n) loops in {_asyncMaxWithdraw}
 * and {_asyncMaxRedeem}. Claims free the slots of fully claimed epochs, but only from the front of the
 * queue: they stop at the oldest Pending epoch, so a controller at the limit cannot submit new requests
 * until that epoch is fulfilled (see {_fulfillRedeem}).
 *
 * NOTE: Each claim converts at the epoch's remaining `totalAssets / totalShares` ratio and rounds
 * down, against the claimant. The rounding loss (less than 1 asset unit per claim) stays in the
 * epoch and goes to the controllers who claim later; the last claimant receives the exact remainder.
 * With very small amounts the loss can be the whole claim: if an epoch settles 3 shares for 2 assets
 * across 3 controllers who requested 1 share each, the first to claim receives 0 assets and the other
 * two receive 1 asset each. With realistic token decimals the loss is negligible. Unlike the ERC-4626
 * inflation attack, these totals cannot be manipulated by donation: they only grow through
 * {requestRedeem} and {_fulfillRedeem}.
 */
abstract contract ERC7540EpochRedeem is ERC7540 {
    using Math for uint256;
    using SafeCast for uint256;
    using DoubleEndedQueue for DoubleEndedQueue.Bytes32Deque;

    /**
     * @dev Per-epoch redeem metadata. `totalAssets` is zero while the epoch is Pending and
     * set to the distributed asset total when the admin calls {_fulfillRedeem}.
     */
    struct EpochRedeem {
        uint256 totalShares;
        uint256 totalAssets;
        mapping(address account => uint256) requests;
    }

    mapping(uint256 epochId => EpochRedeem) private _epochs;
    mapping(address account => DoubleEndedQueue.Bytes32Deque) private _memberOf;
    uint256 private _claimableShares;
    uint256 private _claimableAssets;

    /// @dev Emitted when a redeem epoch transitions from Pending to Claimable via {_fulfillRedeem}.
    event ERC7540EpochRedeemFulfilled(uint256 indexed epochId, uint256 totalShares, uint256 totalAssets);

    /// @dev Attempted to fulfill a redeem epoch that has not yet ended.
    error ERC7540EpochRedeemTooEarly(uint256 epochId);

    /// @dev Attempted to fulfill a redeem epoch with no pending requests.
    error ERC7540EpochRedeemEmptyEpoch(uint256 epochId);

    /// @dev Attempted to fulfill a redeem epoch that has already been fulfilled.
    error ERC7540EpochRedeemAlreadyFulfilled(uint256 epochId);

    /// @dev Attempted to enqueue an epoch for `controller` past {_redeemRequestQueueLimit}.
    error ERC7540EpochRedeemQueueLimitExceeded(address controller);

    /// @inheritdoc ERC7540
    function _isRedeemAsync() internal pure virtual override returns (bool) {
        return true;
    }

    /**
     * @dev Returns the current epoch ID. Defaults to `(block.timestamp + 3 days) / 1 weeks`, so
     * epochs transition at Monday 00:00 UTC (weeks start Monday).
     *
     * IMPORTANT: Successive calls MUST never return a value smaller than any earlier one (they may
     * stay the same or grow). If a later call returns an epoch older than a controller's queue tail,
     * the request enqueues a duplicate entry pointing at the same epoch's shared accounting, which
     * double-counts in {_asyncMaxWithdraw} / {_asyncMaxRedeem} and can settle caller-specified output
     * that was not backed by consumed state.
     */
    function currentRedeemEpoch() public view virtual returns (uint256) {
        return (block.timestamp + 3 days) / 1 weeks;
    }

    /**
     * @dev Returns the total shares queued in `epochId`. Equals the sum of all redeem requests
     * during the Pending phase; decreases as claimants consume their pro-rata share once the
     * epoch is fulfilled, and reaches 0 once the epoch is fully claimed.
     */
    function totalRedeemShares(uint256 epochId) public view virtual returns (uint256) {
        return _epochs[epochId].totalShares;
    }

    /**
     * @dev Returns the assets allocated to `epochId` at fulfillment. Zero before
     * {_fulfillRedeem} is called; decreases as claimants consume their pro-rata share.
     * Together with {totalRedeemShares} it encodes the locked epoch rate.
     */
    function totalRedeemAssets(uint256 epochId) public view virtual returns (uint256) {
        return _epochs[epochId].totalAssets;
    }

    /**
     * @dev Returns the redeem epoch IDs that `controller` has open requests in, in queue order
     * (oldest first). Fully claimed epochs are popped from the queue and no longer appear.
     *
     * Using `start = 0` and `end = type(uint64).max` will return the entire set of epochs.
     */
    function redeemEpochs(
        address controller,
        uint256 start,
        uint256 end
    ) public view virtual returns (uint256[] memory epochIds) {
        bytes32[] memory store = _memberOf[controller].values(start, end);
        assembly ("memory-safe") {
            epochIds := store
        }
    }

    /// @dev A request is pending if its epoch has not yet been fulfilled (`totalAssets == 0`).
    function _pendingRedeemRequest(
        uint256 requestId,
        address controller
    ) internal view virtual override returns (uint256) {
        return totalRedeemAssets(requestId) == 0 ? _epochs[requestId].requests[controller] : 0;
    }

    /// @dev A request is claimable if its epoch has been fulfilled (`totalAssets > 0`).
    function _claimableRedeemRequest(
        uint256 requestId,
        address controller
    ) internal view virtual override returns (uint256) {
        return totalRedeemAssets(requestId) == 0 ? 0 : _epochs[requestId].requests[controller];
    }

    /**
     * @dev Sums claimable assets from `owner`'s fulfilled epochs oldest-first, stopping at the
     * first Pending epoch. Fulfilled epochs behind a Pending one are not counted until the
     * Pending one is fulfilled. Matches {_consumeClaimableWithdraw}.
     *
     * NOTE: O(n) in `owner`'s epochs, bounded by {_redeemRequestQueueLimit} (default 32). Per-account,
     * so an attacker creating many small requests can only inflate their own queue, not
     * other users'. Cross-controller DoS is not possible because epoch fulfillment via
     * {_fulfillRedeem} is O(1) (it sets `totalAssets` for the entire epoch in a single write).
     */
    function _asyncMaxWithdraw(address owner) internal view virtual override returns (uint256 /* assets */) {
        DoubleEndedQueue.Bytes32Deque storage queue = _memberOf[owner];
        uint256 result = 0;
        for (uint256 i = 0; i < queue.length(); ++i) {
            uint256 epochId = uint256(queue.at(i));
            if (totalRedeemAssets(epochId) == 0) break; // stop at the oldest Pending epoch
            result += _convertToRedeemAssets(epochId, _claimableRedeemRequest(epochId, owner), Math.Rounding.Floor);
        }
        return result;
    }

    /// @dev Sums claimable shares across all fulfilled epochs the `owner` participates in. Same as {_asyncMaxWithdraw}.
    function _asyncMaxRedeem(address owner) internal view virtual override returns (uint256 /* shares */) {
        DoubleEndedQueue.Bytes32Deque storage queue = _memberOf[owner];
        uint256 result = 0;
        for (uint256 i = 0; i < queue.length(); ++i) {
            uint256 epochId = uint256(queue.at(i));
            if (totalRedeemAssets(epochId) == 0) break; // stop at the oldest Pending epoch
            result += _claimableRedeemRequest(epochId, owner);
        }
        return result;
    }

    /// @dev Converts `shares` to assets at `epochId`'s locked rate. Returns 0 if `totalShares` is 0.
    function _convertToRedeemAssets(
        uint256 epochId,
        uint256 shares,
        Math.Rounding rounding
    ) internal view virtual returns (uint256) {
        // `totalShares` is 0 for an epoch with no requests, or once it is fully claimed (claims
        // drain both totals together, see {_consumeClaimableWithdraw}).
        uint256 totalShares = totalRedeemShares(epochId);
        return totalShares == 0 ? 0 : shares.mulDiv(totalRedeemAssets(epochId), totalShares, rounding);
    }

    /// @dev Converts `assets` to shares at `epochId`'s locked rate. Returns 0 if `totalAssets` is 0.
    function _convertToRedeemShares(
        uint256 epochId,
        uint256 assets,
        Math.Rounding rounding
    ) internal view virtual returns (uint256) {
        // `totalAssets` is 0 while the epoch is Pending, or once it is fully claimed (claims
        // drain both totals together, see {_consumeClaimableWithdraw}).
        uint256 totalAssets = totalRedeemAssets(epochId);
        return totalAssets == 0 ? 0 : assets.mulDiv(totalRedeemShares(epochId), totalAssets, rounding);
    }

    /**
     * @dev Records the request in the current epoch and enqueues the epoch ID for `controller`
     * if not already present. A zero-amount request is a no-op at the epoch layer (it emits the
     * event via `super` but does not create an unfulfillable epoch or occupy a queue slot).
     *
     * Requirements:
     *
     * * `_msgSender()` must be `controller` or an approved operator of `controller`. This is a
     * strict subset of ERC-7540 request auth (added on top of the base's `owner` allowance/operator
     * check) to prevent third-party queue spam.
     * * The controller's epoch queue must not exceed {_redeemRequestQueueLimit}.
     */
    function _requestRedeem(
        uint256 shares,
        address controller,
        address owner,
        uint256 requestId
    ) internal virtual override {
        _checkOperatorOrController(_isRedeemAsync(), controller, _msgSender());
        if (shares > 0) {
            EpochRedeem storage epoch = _epochs[requestId];
            epoch.totalShares += shares;
            epoch.requests[controller] += shares;

            DoubleEndedQueue.Bytes32Deque storage queue = _memberOf[controller];
            (bool success, bytes32 lastEpochId) = queue.tryBack();
            if (!success || lastEpochId != bytes32(requestId)) {
                // Bound the queue to keep the O(n) loops in _asyncMaxWithdraw and _asyncMaxRedeem cheap.
                // Claims free slots from the front, but only once the oldest queued epoch is fulfilled.
                require(queue.length() < _redeemRequestQueueLimit(), ERC7540EpochRedeemQueueLimitExceeded(controller));

                queue.pushBack(bytes32(requestId));
            }
        }

        super._requestRedeem(shares, controller, owner, requestId);
    }

    /// @dev Redeem Requests are identified by the epoch they are submitted in (see {currentRedeemEpoch}).
    function _getRedeemRequestId(address /* controller */) internal virtual override returns (uint256) {
        return currentRedeemEpoch();
    }

    /**
     * @dev Fulfills a past epoch by setting its `totalAssets`. All requests within the epoch
     * become claimable at the rate `totalAssets / totalShares`.
     *
     * NOTE: When epoch transition is manual, the caller should bump the epoch before calling this.
     *
     * NOTE: Pending vs. fulfilled is distinguished by `totalAssets == 0`. Admins are assumed not to
     * fulfill at zero (a confiscation event with no economic purpose); if 0 is passed by accident, the
     * call is a no-op (no event is emitted) and the admin can re-fulfill. This recovery only holds as
     * long as derived contracts preserve the no-side-effect semantics of this function — if not,
     * derived contracts should restrict `totalAssets != 0`. A genuine total-loss settlement is not
     * representable in this encoding; deployers needing that SHOULD override to encode the fulfilled
     * state separately (e.g. an explicit boolean).
     *
     * NOTE: Out-of-order fulfillment is permitted, but each controller's claims and queue
     * cleanup stay gated on their oldest Pending epoch (see {_consumeClaimableWithdraw}). Funds
     * are not lost, but a controller at {_redeemRequestQueueLimit} cannot submit new requests
     * until admin resolves the front, so admins should stay close to FIFO order. Derived
     * contracts wanting strict FIFO settlement should enforce it here.
     *
     * Requirements:
     *
     * * `epochId` must be a past epoch (less than {currentRedeemEpoch}).
     * * The epoch must have pending shares and must not have been fulfilled already.
     * * The vault must hold enough assets to cover pending deposits and Claimable redeems, including this epoch.
     */
    function _fulfillRedeem(uint256 epochId, uint256 totalAssets) internal virtual {
        require(epochId < currentRedeemEpoch(), ERC7540EpochRedeemTooEarly(epochId));

        uint256 totalShares = totalRedeemShares(epochId);
        require(totalShares > 0, ERC7540EpochRedeemEmptyEpoch(epochId));
        require(totalRedeemAssets(epochId) == 0, ERC7540EpochRedeemAlreadyFulfilled(epochId));

        if (totalAssets > 0) {
            _epochs[epochId].totalAssets = totalAssets;

            _claimableShares += totalShares;
            _claimableAssets += totalAssets;
            require(_isSolvent(), ERC7540InsufficientAssets());

            if (_redeemShareDestination() != address(0)) {
                _burnSharesOnRedeemFulfill(totalAssets, totalShares);
            }

            emit ERC7540EpochRedeemFulfilled(epochId, totalShares, totalAssets);
        }
    }

    /**
     * @dev Consumes `assets` from `controller`'s epochs oldest-first at each epoch's locked rate,
     * dequeueing fully consumed ones. Breaks early when the oldest epoch is still Pending:
     * consuming from it would burn `assets` for zero shares. Claims are therefore gated on the
     * oldest Pending epoch, matching {_asyncMaxWithdraw}.
     *
     * NOTE: Wrappers wanting stricter FIFO semantics should consider overriding to revert when
     * the oldest epoch is Pending.
     *
     * When the claim exhausts the controller's asset entitlement in an epoch, the epoch is dequeued
     * and the controller's entire share request is consumed, so no residue is left behind. Partial
     * claims round the consumed shares up, against the caller: the rounding benefits the remaining
     * claimants of the epoch. If rounding up consumes the last shares of an epoch while assets remain,
     * these assets can no longer be claimed and are released to the vault, where they accrue to the
     * remaining shareholders.
     */
    function _consumeClaimableWithdraw(uint256 assets, address controller) internal virtual override returns (uint256) {
        DoubleEndedQueue.Bytes32Deque storage queue = _memberOf[controller];
        uint256 consumed = 0;
        uint256 shares = 0;

        while (assets > 0) {
            uint256 epochId = uint256(queue.front());
            if (totalRedeemAssets(epochId) == 0) break; // oldest queued epoch is still Pending

            EpochRedeem storage epoch = _epochs[epochId];
            uint256 requestedShares = epoch.requests[controller];
            // Floor here (not ceil) so the per-epoch asset entitlement matches {_asyncMaxWithdraw}.
            // A ceil-rounded `requested` could exhaust `totalAssets` to 0 while `totalShares`
            // remains > 0, dirtying the Pending sentinel and stranding later controllers.
            uint256 requested = _convertToRedeemAssets(epochId, requestedShares, Math.Rounding.Floor);

            // assets < floor(rS*A/S) implies ceil(assets*S/A) <= rS
            (uint256 batchAssets, uint256 batchShares) = assets < requested
                ? (assets, _convertToRedeemShares(epochId, assets, Math.Rounding.Ceil))
                : (requested, requestedShares);

            // Dequeue once the request is fully consumed (including when a partial claim rounds up to it)
            if (batchShares == requestedShares) queue.popFront();

            epoch.requests[controller] = requestedShares - batchShares; // batchShares <= requestedShares
            epoch.totalAssets -= batchAssets; // batchAssets <= floor(rS*A/S) <= totalAssets (matches _asyncMaxWithdraw)
            epoch.totalShares -= batchShares; // batchShares <= requestedShares <= totalShares (invariant)
            assets -= batchAssets; // batchAssets <= assets (batchAssets = assets, or requested <= assets)
            consumed += batchAssets;
            shares += batchShares;

            // All requests are consumed but a partial claim rounded up, leaving assets nobody can claim
            if (epoch.totalShares == 0 && epoch.totalAssets > 0) {
                _claimableAssets -= epoch.totalAssets;
                epoch.totalAssets = 0;
            }
        }

        _claimableShares -= shares;
        _claimableAssets -= consumed;

        return shares;
    }

    /**
     * @dev Same as {_consumeClaimableWithdraw} but iterates by shares instead of assets.
     *
     * NOTE: When the epoch's locked rate skews the `shares : assets` ratio (either direction),
     * a small `shares` input can round `batchAssets` to zero; the epoch's share pool moves
     * without paying assets to the caller. At realistic ERC-20 decimals the per-call drift is
     * sub-cent. Deployers with non-standard decimals or a zero-drift requirement SHOULD override
     * to revert when `batchShares > 0 && batchAssets == 0`.
     */
    function _consumeClaimableRedeem(uint256 shares, address controller) internal virtual override returns (uint256) {
        DoubleEndedQueue.Bytes32Deque storage queue = _memberOf[controller];
        uint256 consumed = 0;
        uint256 assets = 0;

        while (shares > 0) {
            uint256 epochId = uint256(queue.front());
            if (totalRedeemAssets(epochId) == 0) break; // oldest queued epoch is still Pending

            EpochRedeem storage epoch = _epochs[epochId];
            uint256 requested = epoch.requests[controller];
            if (requested <= shares) queue.popFront();

            uint256 batchShares = requested.min(shares);
            uint256 batchAssets = _convertToRedeemAssets(epochId, batchShares, Math.Rounding.Floor);

            epoch.requests[controller] = requested - batchShares; // batchShares <= requested via .min
            epoch.totalShares -= batchShares; // batchShares <= epoch.totalShares (invariant: requests[c] <= totalShares)
            epoch.totalAssets -= batchAssets; // batchAssets = floor(batchShares * A/S) <= epoch.totalAssets (since batchShares <= totalShares)
            shares -= batchShares; // batchShares <= shares (via .min)
            consumed += batchShares;
            assets += batchAssets;
        }

        _claimableShares -= consumed;
        _claimableAssets -= assets;

        return assets;
    }

    /// @dev Assets owed to fulfilled but unclaimed epochs.
    function _totalClaimableRedeemAssets() internal view virtual override returns (uint256) {
        return _claimableAssets;
    }

    /// @dev Shares of fulfilled but unclaimed epochs.
    function _totalClaimableRedeemShares() internal view virtual override returns (uint256) {
        return _claimableShares;
    }

    /**
     * @dev Maximum number of epoch entries in a controller's queue. Defaults to 32.
     * Prevents unbounded iteration in {_asyncMaxWithdraw} and {_asyncMaxRedeem}.
     */
    function _redeemRequestQueueLimit() internal view virtual returns (uint256) {
        return 32;
    }
}
