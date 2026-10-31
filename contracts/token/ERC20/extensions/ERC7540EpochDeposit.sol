// SPDX-License-Identifier: MIT

pragma solidity ^0.8.31;

import {Math} from "../../../utils/math/Math.sol";
import {SafeCast} from "../../../utils/math/SafeCast.sol";
import {DoubleEndedQueue} from "../../../utils/structs/DoubleEndedQueue.sol";
import {ERC7540} from "./ERC7540.sol";

/**
 * @dev Epoch-based batch fulfillment strategy for asynchronous deposits.
 *
 * Extends {ERC7540} with a deposit flow where requests submitted during the same epoch are batched
 * together and settled at a single exchange rate when the admin closes the epoch via {_fulfillDeposit}.
 * All controllers within a fulfilled epoch receive the same pro-rata conversion from assets to shares.
 *
 * Production equivalents:
 * https://github.com/Storm-Labs-Inc/cove-contracts-core/blob/master/src/BasketToken.sol[Cove],
 * https://github.com/AmphorProtocol/asynchronous-vault/tree/main[Amphor],
 * https://github.com/hopperlabsxyz/lagoon-v0/blob/main/src/v0.5.0/ERC7540.sol[Lagoon].
 *
 * The `requestId` returned by {requestDeposit} is the epoch ID. By default, epochs are weekly
 * and start on Mondays (`(block.timestamp + 3 days) / 1 weeks`); override {currentDepositEpoch} to change
 * the cadence or use manually-bumped epoch counters.
 *
 * Each account tracks its epoch memberships via a {DoubleEndedQueue} capped at
 * {_depositRequestQueueLimit} entries (default: 32) to bound the O(n) loops in {_asyncMaxDeposit}
 * and {_asyncMaxMint}. Claims free the slots of fully claimed epochs, but only from the front of the
 * queue: they stop at the oldest Pending epoch, so a controller at the limit cannot submit new requests
 * until that epoch is fulfilled (see {_fulfillDeposit}).
 *
 * NOTE: Each claim converts at the epoch's remaining `totalShares / totalAssets` ratio and rounds
 * down, against the claimant. The rounding loss (less than 1 share unit per claim) stays in the
 * epoch and goes to the controllers who claim later; the last claimant receives the exact remainder.
 * With very small amounts the loss can be the whole claim: if an epoch settles 3 assets for 2 shares
 * across 3 controllers who requested 1 asset each, the first to claim receives 0 shares and the other
 * two receive 1 share each. With realistic token decimals the loss is negligible. Unlike the ERC-4626
 * inflation attack, these totals cannot be manipulated by donation: they only grow through
 * {requestDeposit} and {_fulfillDeposit}. To reduce the loss further, override {_decimalsOffset} so
 * that shares have more decimals than assets.
 */
abstract contract ERC7540EpochDeposit is ERC7540 {
    using Math for uint256;
    using SafeCast for uint256;
    using DoubleEndedQueue for DoubleEndedQueue.Bytes32Deque;

    /**
     * @dev Per-epoch deposit metadata. `totalShares` is zero while the epoch is Pending and
     * set to the minted share total when the admin calls {_fulfillDeposit}.
     */
    struct EpochDeposit {
        uint256 totalAssets;
        uint256 totalShares;
        mapping(address account => uint256) requests;
    }

    mapping(uint256 epochId => EpochDeposit) private _epochs;
    mapping(address account => DoubleEndedQueue.Bytes32Deque) private _memberOf;
    uint256 private _claimableAssets;
    uint256 private _claimableShares;

    /// @dev Emitted when a deposit epoch transitions from Pending to Claimable via {_fulfillDeposit}.
    event ERC7540EpochDepositFulfilled(uint256 indexed epochId, uint256 totalAssets, uint256 totalShares);

    /// @dev Attempted to fulfill a deposit epoch that has not yet ended.
    error ERC7540EpochDepositTooEarly(uint256 epochId);

    /// @dev Attempted to fulfill a deposit epoch with no pending requests.
    error ERC7540EpochDepositEmptyEpoch(uint256 epochId);

    /// @dev Attempted to fulfill a deposit epoch that has already been fulfilled.
    error ERC7540EpochDepositAlreadyFulfilled(uint256 epochId);

    /// @dev Attempted to enqueue an epoch for `controller` past {_depositRequestQueueLimit}.
    error ERC7540EpochDepositQueueLimitExceeded(address controller);

    /// @inheritdoc ERC7540
    function _isDepositAsync() internal pure virtual override returns (bool) {
        return true;
    }

    /**
     * @dev Returns the current epoch ID. Defaults to `(block.timestamp + 3 days) / 1 weeks`, so
     * epochs transition at Monday 00:00 UTC (weeks start Monday).
     *
     * IMPORTANT: Successive calls MUST never return a value smaller than any earlier one (they may
     * stay the same or grow). If a later call returns an epoch older than a controller's queue tail,
     * the request enqueues a duplicate entry pointing at the same epoch's shared accounting, which
     * double-counts in {_asyncMaxDeposit} / {_asyncMaxMint} and can settle caller-specified output
     * that was not backed by consumed state.
     */
    function currentDepositEpoch() public view virtual returns (uint256) {
        return (block.timestamp + 3 days) / 1 weeks;
    }

    /**
     * @dev Returns the total assets queued in `epochId`. Equals the sum of all deposit requests
     * during the Pending phase; decreases as claimants consume their pro-rata share once the
     * epoch is fulfilled, and reaches 0 once the epoch is fully claimed.
     */
    function totalDepositAssets(uint256 epochId) public view virtual returns (uint256) {
        return _epochs[epochId].totalAssets;
    }

    /**
     * @dev Returns the shares allocated to `epochId` at fulfillment. Zero before
     * {_fulfillDeposit} is called; decreases as claimants consume their pro-rata share.
     * Together with {totalDepositAssets} it encodes the locked epoch rate.
     */
    function totalDepositShares(uint256 epochId) public view virtual returns (uint256) {
        return _epochs[epochId].totalShares;
    }

    /**
     * @dev Returns the deposit epoch IDs that `controller` has open requests in, in queue order
     * (oldest first). Fully claimed epochs are popped from the queue and no longer appear.
     *
     * Using `start = 0` and `end = type(uint64).max` will return the entire set of epochs.
     */
    function depositEpochs(
        address controller,
        uint256 start,
        uint256 end
    ) public view virtual returns (uint256[] memory epochIds) {
        bytes32[] memory store = _memberOf[controller].values(start, end);
        assembly ("memory-safe") {
            epochIds := store
        }
    }

    /// @dev A request is pending if its epoch has not yet been fulfilled (`totalShares == 0`).
    function _pendingDepositRequest(
        uint256 requestId,
        address controller
    ) internal view virtual override returns (uint256) {
        return totalDepositShares(requestId) == 0 ? _epochs[requestId].requests[controller] : 0;
    }

    /// @dev A request is claimable if its epoch has been fulfilled (`totalShares > 0`).
    function _claimableDepositRequest(
        uint256 requestId,
        address controller
    ) internal view virtual override returns (uint256) {
        return totalDepositShares(requestId) == 0 ? 0 : _epochs[requestId].requests[controller];
    }

    /**
     * @dev Sums claimable assets from `owner`'s fulfilled epochs oldest-first, stopping at the
     * first Pending epoch. Fulfilled epochs behind a Pending one are not counted until the
     * Pending one is fulfilled. Matches {_consumeClaimableDeposit}.
     *
     * NOTE: O(n) in `owner`'s epochs, bounded by {_depositRequestQueueLimit} (default 32). Per-account,
     * so an attacker creating many small requests can only inflate their own queue, not
     * other users'. Cross-controller DoS is not possible because epoch fulfillment via
     * {_fulfillDeposit} is O(1) (it sets `totalShares` for the entire epoch in a single write).
     */
    function _asyncMaxDeposit(address owner) internal view virtual override returns (uint256 /* assets */) {
        DoubleEndedQueue.Bytes32Deque storage queue = _memberOf[owner];
        uint256 result = 0;
        for (uint256 i = 0; i < queue.length(); ++i) {
            uint256 epochId = uint256(queue.at(i));
            if (totalDepositShares(epochId) == 0) break; // stop at the oldest Pending epoch
            result += _claimableDepositRequest(epochId, owner);
        }
        return result;
    }

    /// @dev Sums claimable shares across all fulfilled epochs the `owner` participates in. Same as {_asyncMaxDeposit}.
    function _asyncMaxMint(address owner) internal view virtual override returns (uint256 /* shares */) {
        DoubleEndedQueue.Bytes32Deque storage queue = _memberOf[owner];
        uint256 result = 0;
        for (uint256 i = 0; i < queue.length(); ++i) {
            uint256 epochId = uint256(queue.at(i));
            if (totalDepositShares(epochId) == 0) break; // stop at the oldest Pending epoch
            result += _convertToDepositShares(epochId, _claimableDepositRequest(epochId, owner), Math.Rounding.Floor);
        }
        return result;
    }

    /// @dev Converts `assets` to shares at `epochId`'s locked rate. Returns 0 if `totalAssets` is 0.
    function _convertToDepositShares(
        uint256 epochId,
        uint256 assets,
        Math.Rounding rounding
    ) internal view virtual returns (uint256) {
        // `totalAssets` is 0 for an epoch with no requests, or once it is fully claimed (claims
        // drain both totals together, see {_consumeClaimableMint}).
        uint256 totalAssets = totalDepositAssets(epochId);
        return totalAssets == 0 ? 0 : assets.mulDiv(totalDepositShares(epochId), totalAssets, rounding);
    }

    /// @dev Converts `shares` to assets at `epochId`'s locked rate. Returns 0 if `totalShares` is 0.
    function _convertToDepositAssets(
        uint256 epochId,
        uint256 shares,
        Math.Rounding rounding
    ) internal view virtual returns (uint256) {
        // `totalShares` is 0 while the epoch is Pending, or once it is fully claimed (claims
        // drain both totals together, see {_consumeClaimableMint}).
        uint256 totalShares = totalDepositShares(epochId);
        return totalShares == 0 ? 0 : shares.mulDiv(totalDepositAssets(epochId), totalShares, rounding);
    }

    /**
     * @dev Records the request in the current epoch and enqueues the epoch ID for `controller`
     * if not already present. A zero-amount request is a no-op at the epoch layer (it emits the
     * event via `super` but does not create an unfulfillable epoch or occupy a queue slot).
     *
     * Requirements:
     *
     * * `_msgSender()` must be `controller` or an approved operator of `controller`. This is a
     * strict subset of ERC-7540 request auth (added on top of the base's `owner` check) to
     * prevent third-party queue spam.
     * * The controller's epoch queue must not exceed {_depositRequestQueueLimit}.
     */
    function _requestDeposit(
        uint256 assets,
        address controller,
        address owner,
        uint256 requestId
    ) internal virtual override {
        _checkOperatorOrController(_isDepositAsync(), controller, _msgSender());

        // Transfer the assets first (see {ERC7540-_requestDeposit}), so that a reentrancy through the asset
        // observes neither the assets nor the epoch's updated accounting.
        super._requestDeposit(assets, controller, owner, requestId);

        if (assets > 0) {
            EpochDeposit storage epoch = _epochs[requestId];
            epoch.totalAssets += assets;
            epoch.requests[controller] += assets;

            DoubleEndedQueue.Bytes32Deque storage queue = _memberOf[controller];
            (bool success, bytes32 lastEpochId) = queue.tryBack();
            if (!success || lastEpochId != bytes32(requestId)) {
                // Bound the queue to keep the O(n) loops in _asyncMaxDeposit and _asyncMaxMint cheap.
                // Claims free slots from the front, but only once the oldest queued epoch is fulfilled.
                require(
                    queue.length() < _depositRequestQueueLimit(),
                    ERC7540EpochDepositQueueLimitExceeded(controller)
                );

                queue.pushBack(bytes32(requestId));
            }
        }
    }

    /// @dev Deposit Requests are identified by the epoch they are submitted in (see {currentDepositEpoch}).
    function _getDepositRequestId(address /* controller */) internal virtual override returns (uint256) {
        return currentDepositEpoch();
    }

    /**
     * @dev Fulfills a past epoch by setting its `totalShares`. All requests within the epoch
     * become claimable at the rate `totalShares / totalAssets`.
     *
     * NOTE: When epoch transition is manual, the caller should bump the epoch before calling this.
     *
     * NOTE: Pending vs. fulfilled is distinguished by `totalShares == 0`. Admins are assumed not to
     * fulfill at zero (a confiscation event with no economic purpose); if 0 is passed by accident, the
     * call is a no-op (no event is emitted) and the admin can re-fulfill. This recovery only holds as
     * long as derived contracts preserve the no-side-effect semantics of this function — if not,
     * derived contracts should restrict `totalShares != 0`. A genuine total-loss settlement is not
     * representable in this encoding; deployers needing that SHOULD override to encode the fulfilled
     * state separately (e.g. an explicit boolean).
     *
     * NOTE: Out-of-order fulfillment is permitted, but each controller's claims and queue
     * cleanup stay gated on their oldest Pending epoch (see {_consumeClaimableDeposit}). Funds
     * are not lost, but a controller at {_depositRequestQueueLimit} cannot submit new requests
     * until admin resolves the front, so admins should stay close to FIFO order. Derived
     * contracts wanting strict FIFO settlement should enforce it here.
     *
     * Requirements:
     *
     * * `epochId` must be a past epoch (less than {currentDepositEpoch}).
     * * The epoch must have pending assets and must not have been fulfilled already.
     */
    function _fulfillDeposit(uint256 epochId, uint256 totalShares) internal virtual {
        require(epochId < currentDepositEpoch(), ERC7540EpochDepositTooEarly(epochId));

        uint256 totalAssets = totalDepositAssets(epochId);
        require(totalAssets > 0, ERC7540EpochDepositEmptyEpoch(epochId));
        require(totalDepositShares(epochId) == 0, ERC7540EpochDepositAlreadyFulfilled(epochId));

        if (totalShares > 0) {
            _epochs[epochId].totalShares = totalShares;

            if (_depositShareOrigin() == address(0)) {
                _claimableAssets += totalAssets;
                _claimableShares += totalShares;
            } else {
                _mintSharesOnDepositFulfill(totalAssets, totalShares);
            }

            emit ERC7540EpochDepositFulfilled(epochId, totalAssets, totalShares);
        }
    }

    /**
     * @dev Consumes `assets` from `controller`'s epochs oldest-first at each epoch's locked rate,
     * dequeueing fully consumed ones. Breaks early when the oldest epoch is still Pending:
     * consuming from it would burn `assets` for zero shares. Claims are therefore gated on the
     * oldest Pending epoch, matching {_asyncMaxDeposit}.
     *
     * NOTE: Wrappers wanting stricter FIFO semantics should consider overriding to revert when
     * the oldest epoch is Pending.
     *
     * NOTE: When the epoch's locked rate skews the `assets : shares` ratio (either direction),
     * a small `assets` input can round `batchShares` to zero; the epoch's asset pool moves
     * without minting shares to the caller. At realistic ERC-20 decimals the per-call drift is
     * sub-cent. Deployers with non-standard decimals or a zero-drift requirement SHOULD override
     * to revert when `batchAssets > 0 && batchShares == 0`.
     */
    function _consumeClaimableDeposit(uint256 assets, address controller) internal virtual override returns (uint256) {
        DoubleEndedQueue.Bytes32Deque storage queue = _memberOf[controller];
        uint256 consumed = 0;
        uint256 shares = 0;

        while (assets > 0) {
            uint256 epochId = uint256(queue.front());
            if (totalDepositShares(epochId) == 0) break; // oldest queued epoch is still Pending

            EpochDeposit storage epoch = _epochs[epochId];
            uint256 requested = epoch.requests[controller];
            if (requested <= assets) queue.popFront();

            uint256 batchAssets = requested.min(assets);
            uint256 batchShares = _convertToDepositShares(epochId, batchAssets, Math.Rounding.Floor);

            epoch.requests[controller] = requested - batchAssets; // batchAssets <= requested via .min
            epoch.totalAssets -= batchAssets; // batchAssets <= epoch.totalAssets (invariant: requests[c] <= totalAssets)
            epoch.totalShares -= batchShares; // batchShares = floor(batchAssets * S/A) <= epoch.totalShares (since batchAssets <= totalAssets)
            assets -= batchAssets; // batchAssets <= assets (via .min)
            consumed += batchAssets;
            shares += batchShares;
        }

        if (_depositShareOrigin() == address(0)) {
            _claimableAssets -= consumed;
            _claimableShares -= shares;
        }

        return shares;
    }

    /**
     * @dev Same as {_consumeClaimableDeposit} but iterates by shares instead of assets.
     *
     * When the claim exhausts the controller's share entitlement in an epoch, the epoch is dequeued
     * and the controller's entire asset request is consumed, so no residue is left behind. Partial
     * claims round the consumed assets up, against the caller: the rounding benefits the remaining
     * claimants of the epoch. If rounding up consumes the last assets of an epoch while shares remain,
     * these shares can no longer be claimed and are released to the vault (burned from
     * {_depositShareOrigin} when shares are minted at fulfillment).
     */
    function _consumeClaimableMint(uint256 shares, address controller) internal virtual override returns (uint256) {
        DoubleEndedQueue.Bytes32Deque storage queue = _memberOf[controller];
        uint256 consumed = 0;
        uint256 assets = 0;

        while (shares > 0) {
            uint256 epochId = uint256(queue.front());
            if (totalDepositShares(epochId) == 0) break; // oldest queued epoch is still Pending

            EpochDeposit storage epoch = _epochs[epochId];
            uint256 requestedAssets = epoch.requests[controller];
            // Floor here (not ceil) so the per-epoch share entitlement matches {_asyncMaxMint}.
            // A ceil-rounded `requested` could exhaust `totalShares` to 0 while `totalAssets`
            // remains > 0, dirtying the Pending sentinel and stranding later controllers.
            uint256 requested = _convertToDepositShares(epochId, requestedAssets, Math.Rounding.Floor);

            // shares < floor(rA*S/A) implies ceil(shares*A/S) <= rA
            (uint256 batchShares, uint256 batchAssets) = shares < requested
                ? (shares, _convertToDepositAssets(epochId, shares, Math.Rounding.Ceil))
                : (requested, requestedAssets);

            // Dequeue once the request is fully consumed (including when a partial claim rounds up to it)
            if (batchAssets == requestedAssets) queue.popFront();

            epoch.requests[controller] = requestedAssets - batchAssets; // batchAssets <= requestedAssets
            epoch.totalAssets -= batchAssets; // batchAssets <= requestedAssets <= totalAssets (invariant)
            epoch.totalShares -= batchShares; // batchShares <= floor(rA*S/A) <= totalShares (matches _asyncMaxMint)
            shares -= batchShares; // batchShares <= shares (batchShares = shares, or requested <= shares)
            consumed += batchShares;
            assets += batchAssets;

            // All requests are consumed but a partial claim rounded up, leaving shares nobody can claim
            if (epoch.totalAssets == 0 && epoch.totalShares > 0) {
                uint256 residue = epoch.totalShares;
                epoch.totalShares = 0;
                if (_depositShareOrigin() == address(0)) {
                    _claimableShares -= residue;
                } else {
                    _burn(_depositShareOrigin(), residue);
                }
            }
        }

        if (_depositShareOrigin() == address(0)) {
            _claimableAssets -= assets;
            _claimableShares -= consumed;
        }

        return assets;
    }

    /**
     * @dev Assets of fulfilled but unclaimed epochs. Only tracked in mint-on-claim custody: with pre-mint
     * custody, fulfillment already settles them in {totalPendingDepositAssets} and {_totalOutstandingShares}.
     */
    function _totalClaimableDepositAssets() internal view virtual override returns (uint256) {
        return _depositShareOrigin() == address(0) ? _claimableAssets : 0;
    }

    /// @dev Shares owed to fulfilled but unclaimed epochs. See {_totalClaimableDepositAssets}.
    function _totalClaimableDepositShares() internal view virtual override returns (uint256) {
        return _depositShareOrigin() == address(0) ? _claimableShares : 0;
    }

    /**
     * @dev Maximum number of epoch entries in a controller's queue. Defaults to 32.
     * Prevents unbounded iteration in {_asyncMaxDeposit} and {_asyncMaxMint}.
     */
    function _depositRequestQueueLimit() internal view virtual returns (uint256) {
        return 32;
    }
}
