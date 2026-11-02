// SPDX-License-Identifier: MIT

pragma solidity ^0.8.31;

import {Math} from "../../../utils/math/Math.sol";
import {ERC7540} from "./ERC7540.sol";

/**
 * @dev Admin-controlled (operator-triggered) fulfillment strategy for asynchronous deposits.
 *
 * Extends {ERC7540} with a deposit flow where a privileged caller explicitly transitions requests
 * from Pending to Claimable by calling {_fulfillDeposit}. The caller provides both the `assets`
 * amount and the corresponding `shares`, giving the fulfiller explicit control over the exchange rate.
 *
 * This is the most flexible fulfillment model. Epoch-based batch settlement, FIFO queues, and
 * cross-chain oracle-gated settlement can all be composed on top.
 *
 * Production equivalents include
 * https://github.com/usdai-foundation/usdai-contracts/blob/main/src/StakedUSDai.sol[USDai],
 * https://github.com/plumenetwork/nest-protocol/blob/main/contracts/NestVaultCore.sol[Nest (Plume)],
 * https://github.com/turingcapitalgroup/metaVault/blob/main/src/MetaVault.sol[MetaVault], and
 * https://github.com/centrifuge/protocol/blob/main/src/vaults/AsyncVault.sol[Centrifuge].
 *
 * All requests share `requestId = 0` (per-controller accounting only).
 */
abstract contract ERC7540AdminDeposit is ERC7540 {
    /**
     * @dev Struct containing the per-controller state for a deposit request.
     * When a request becomes claimable via {_fulfillDeposit}, the exchange rate is locked
     * in the `claimableAssets` / `claimableShares` pair.
     */
    struct PendingDeposit {
        uint256 pendingAssets;
        uint256 claimableAssets;
        uint256 claimableShares;
    }

    mapping(address controller => PendingDeposit) private _deposits;
    uint256 private _totalClaimableAssets;
    uint256 private _totalClaimableShares;

    /// @dev Emitted when a deposit request transitions from Pending to Claimable.
    event DepositClaimable(address indexed controller, uint256 indexed requestId, uint256 assets, uint256 shares);

    /// @dev The `assets` to fulfill exceeds the `pendingAssets` for the controller.
    error ERC7540DepositInsufficientPendingAssets(uint256 assets, uint256 pendingAssets);

    /// @inheritdoc ERC7540
    function _isDepositAsync() internal pure virtual override returns (bool) {
        return true;
    }

    /// @dev All the Requests of a controller are aggregated under `requestId = 0`.
    function _getDepositRequestId(address /* controller */) internal virtual override returns (uint256) {
        return 0;
    }

    /// @dev Records per-controller pending state after delegating to {ERC7540-_requestDeposit}.
    function _requestDeposit(
        uint256 assets,
        address controller,
        address owner,
        uint256 requestId
    ) internal virtual override {
        // Transfer the assets first (see {ERC7540-_requestDeposit}), so that a reentrancy through the asset
        // observes neither the assets nor the controller's updated pending state.
        super._requestDeposit(assets, controller, owner, requestId);
        _deposits[controller].pendingAssets += assets;
    }

    /**
     * @dev Fulfills a pending deposit request by transitioning it from Pending to Claimable state.
     *
     * The caller provides both `assets` and `shares`, locking the exchange rate at fulfillment time.
     * The fulfiller should ensure the vault's `totalAssets()` already reflects the deposited assets
     * (e.g. after deploying them to a yield source) to avoid diluting existing holders.
     *
     * Emits a {DepositClaimable} event.
     *
     * Requirements:
     *
     * * `assets` must not exceed the pending deposit amount for the `controller`.
     *
     * NOTE: Multiple fulfillments with different exchange rates will blend into a weighted average.
     * For example, fulfilling 50 assets → 100 shares (2:1) then 50 assets → 25 shares (0.5:1) produces
     * claimableAssets=100 and claimableShares=125. A partial claim of 50 assets yields
     * `mulDiv(50, 125, 100) = 62` shares: the weighted average rate, not either original rate.
     * Integrators expecting per-fulfillment rate isolation should use a different strategy (e.g. epochs).
     */
    function _fulfillDeposit(uint256 assets, uint256 shares, address controller) internal virtual {
        uint256 pendingAssets = pendingDepositRequest(0, controller);
        require(assets <= pendingAssets, ERC7540DepositInsufficientPendingAssets(assets, pendingAssets));

        _deposits[controller].pendingAssets -= assets;
        _deposits[controller].claimableAssets += assets;
        _deposits[controller].claimableShares += shares;

        if (_depositShareOrigin() == address(0)) {
            _totalClaimableAssets += assets;
            _totalClaimableShares += shares;
        } else {
            _mintSharesOnDepositFulfill(assets, shares);
        }

        emit DepositClaimable(controller, 0, assets, shares);
    }

    /// @dev Consumes `assets` from the claimable deposit and returns the proportional shares (rounded down).
    function _consumeClaimableDeposit(uint256 assets, address controller) internal virtual override returns (uint256) {
        // When `assets` equals the controller's full claimable balance (including the case where both
        // sides are 0), the entire remaining `claimableShares` is returned and consumed. This drains any
        // residue left after a partial claim was rounded against the share side.
        uint256 maxAssets = maxDeposit(controller);
        uint256 maxShares = maxMint(controller);
        uint256 shares = assets == maxAssets
            ? maxShares
            : Math.mulDiv(assets, maxShares, maxAssets, Math.Rounding.Floor);

        _deposits[controller].claimableAssets -= assets;
        _deposits[controller].claimableShares -= shares;
        if (_depositShareOrigin() == address(0)) {
            _totalClaimableAssets -= assets;
            _totalClaimableShares -= shares;
        }
        return shares;
    }

    /// @dev Consumes `shares` from the claimable deposit and returns the proportional assets (rounded up).
    function _consumeClaimableMint(uint256 shares, address controller) internal virtual override returns (uint256) {
        // When `shares` equals the controller's full claimable balance (including the case where both
        // sides are 0), the entire remaining `claimableAssets` is returned and consumed. This drains any
        // residue left after a partial claim was rounded against the asset side.
        uint256 maxAssets = maxDeposit(controller);
        uint256 maxShares = maxMint(controller);
        uint256 assets = shares == maxShares
            ? maxAssets
            : Math.mulDiv(shares, maxAssets, maxShares, Math.Rounding.Ceil);

        _deposits[controller].claimableAssets -= assets;
        _deposits[controller].claimableShares -= shares;
        if (_depositShareOrigin() == address(0)) {
            _totalClaimableAssets -= assets;
            _totalClaimableShares -= shares;
        }
        return assets;
    }

    /// @inheritdoc ERC7540
    function _pendingDepositRequest(
        uint256 /*requestId*/,
        address controller
    ) internal view virtual override returns (uint256) {
        return _deposits[controller].pendingAssets;
    }

    /// @inheritdoc ERC7540
    function _claimableDepositRequest(
        uint256 /*requestId*/,
        address controller
    ) internal view virtual override returns (uint256) {
        return _deposits[controller].claimableAssets;
    }

    /// @inheritdoc ERC7540
    function _asyncMaxDeposit(address owner) internal view virtual override returns (uint256) {
        return _deposits[owner].claimableAssets;
    }

    /// @inheritdoc ERC7540
    function _asyncMaxMint(address owner) internal view virtual override returns (uint256) {
        return _deposits[owner].claimableShares;
    }

    /**
     * @dev Assets of fulfilled but unclaimed deposits. Only tracked in mint-on-claim custody: with pre-mint
     * custody, fulfillment already settles them in {totalPendingDepositAssets} and {_totalOutstandingShares}.
     */
    function _totalClaimableDepositAssets() internal view virtual override returns (uint256) {
        return _depositShareOrigin() == address(0) ? _totalClaimableAssets : 0;
    }

    /// @dev Shares owed to fulfilled but unclaimed deposits. See {_totalClaimableDepositAssets}.
    function _totalClaimableDepositShares() internal view virtual override returns (uint256) {
        return _depositShareOrigin() == address(0) ? _totalClaimableShares : 0;
    }
}
