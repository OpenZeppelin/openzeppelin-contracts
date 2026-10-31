// SPDX-License-Identifier: MIT

pragma solidity ^0.8.31;

import {Math} from "../../../utils/math/Math.sol";
import {ERC7540} from "./ERC7540.sol";

/**
 * @dev Admin-controlled (operator-triggered) fulfillment strategy for asynchronous redemptions.
 *
 * Extends {ERC7540} with a redeem flow where a privileged caller explicitly transitions requests
 * from Pending to Claimable by calling {_fulfillRedeem}. The caller provides both the `shares`
 * amount and the corresponding `assets`, giving the fulfiller explicit control over the exchange rate.
 *
 * The fulfiller must ensure the vault holds enough underlying assets before calling {_fulfillRedeem}.
 * Asset sourcing (unwinding positions, bridging cross-chain, etc.) is application-specific and is
 * not part of this contract.
 *
 * Production equivalents include
 * https://github.com/usdai-foundation/usdai-contracts/blob/main/src/StakedUSDai.sol[USDai],
 * https://github.com/plumenetwork/nest-protocol/blob/main/contracts/NestVaultCore.sol[Nest (Plume)],
 * https://github.com/turingcapitalgroup/metaVault/blob/main/src/MetaVault.sol[MetaVault], and
 * https://github.com/centrifuge/protocol/blob/main/src/vaults/AsyncVault.sol[Centrifuge].
 *
 * All requests share `requestId = 0` (per-controller accounting only).
 */
abstract contract ERC7540AdminRedeem is ERC7540 {
    /**
     * @dev Struct containing the per-controller state for a redeem request.
     * When a request becomes claimable via {_fulfillRedeem}, the exchange rate is locked
     * in the `claimableShares` / `claimableAssets` pair.
     */
    struct PendingRedeem {
        uint256 pendingShares;
        uint256 claimableShares;
        uint256 claimableAssets;
    }

    mapping(address controller => PendingRedeem) private _redeems;
    uint256 private _totalClaimableAssets;
    uint256 private _totalClaimableShares;

    /// @dev Emitted when a redeem request transitions from Pending to Claimable.
    event RedeemClaimable(address indexed controller, uint256 indexed requestId, uint256 assets, uint256 shares);

    /// @dev The `shares` to fulfill exceeds the `pendingShares` for the controller.
    error ERC7540RedeemInsufficientPendingShares(uint256 shares, uint256 pendingShares);

    /// @inheritdoc ERC7540
    function _isRedeemAsync() internal pure virtual override returns (bool) {
        return true;
    }

    /// @dev All the Requests of a controller are aggregated under `requestId = 0`.
    function _getRedeemRequestId(address /* controller */) internal virtual override returns (uint256) {
        return 0;
    }

    /// @dev Records per-controller pending state before delegating to {ERC7540-_requestRedeem}.
    function _requestRedeem(
        uint256 shares,
        address controller,
        address owner,
        uint256 requestId
    ) internal virtual override {
        _redeems[controller].pendingShares += shares;
        super._requestRedeem(shares, controller, owner, requestId);
    }

    /**
     * @dev Fulfills a pending redeem request by transitioning it from Pending to Claimable state.
     *
     * The caller provides both `shares` and `assets`, locking the exchange rate at fulfillment time.
     * The fulfiller must ensure the vault holds enough underlying assets to cover the `assets` amount
     * before calling this function (see {_isSolvent}).
     *
     * Emits a {RedeemClaimable} event.
     *
     * Requirements:
     *
     * * `shares` must not exceed the pending redeem amount for the `controller`.
     * * The vault must hold enough assets to cover pending deposits and Claimable redeems, including this one.
     */
    function _fulfillRedeem(uint256 shares, uint256 assets, address controller) internal virtual {
        uint256 pendingShares = pendingRedeemRequest(0, controller);
        require(shares <= pendingShares, ERC7540RedeemInsufficientPendingShares(shares, pendingShares));

        _redeems[controller].pendingShares -= shares;
        _redeems[controller].claimableShares += shares;
        _redeems[controller].claimableAssets += assets;
        _totalClaimableShares += shares;
        _totalClaimableAssets += assets;
        require(_isSolvent(), ERC7540InsufficientAssets());

        if (_redeemShareDestination() != address(0)) {
            _burnSharesOnRedeemFulfill(assets, shares);
        }

        emit RedeemClaimable(controller, 0, assets, shares);
    }

    /// @dev Consumes `assets` from the claimable redeem and returns the proportional shares (rounded up).
    function _consumeClaimableWithdraw(uint256 assets, address controller) internal virtual override returns (uint256) {
        // When `assets` equals the controller's full claimable balance (including the case where both
        // sides are 0), the entire remaining `claimableShares` is returned and consumed. This drains any
        // residue left after a partial claim was rounded against the share side.
        uint256 maxAssets = maxWithdraw(controller);
        uint256 maxShares = maxRedeem(controller);
        uint256 shares = assets == maxAssets
            ? maxShares
            : Math.mulDiv(assets, maxShares, maxAssets, Math.Rounding.Ceil);

        _redeems[controller].claimableAssets -= assets;
        _redeems[controller].claimableShares -= shares;
        _totalClaimableAssets -= assets;
        _totalClaimableShares -= shares;
        return shares;
    }

    /// @dev Consumes `shares` from the claimable redeem and returns the proportional assets (rounded down).
    function _consumeClaimableRedeem(uint256 shares, address controller) internal virtual override returns (uint256) {
        // When `shares` equals the controller's full claimable balance (including the case where both
        // sides are 0), the entire remaining `claimableAssets` is returned and consumed. This drains any
        // residue left after a partial claim was rounded against the asset side.
        uint256 maxShares = maxRedeem(controller);
        uint256 maxAssets = maxWithdraw(controller);
        uint256 assets = shares == maxShares
            ? maxAssets
            : Math.mulDiv(shares, maxAssets, maxShares, Math.Rounding.Floor);

        _redeems[controller].claimableAssets -= assets;
        _redeems[controller].claimableShares -= shares;
        _totalClaimableAssets -= assets;
        _totalClaimableShares -= shares;
        return assets;
    }

    /// @inheritdoc ERC7540
    function _pendingRedeemRequest(
        uint256 /*requestId*/,
        address controller
    ) internal view virtual override returns (uint256) {
        return _redeems[controller].pendingShares;
    }

    /// @inheritdoc ERC7540
    function _claimableRedeemRequest(
        uint256 /*requestId*/,
        address controller
    ) internal view virtual override returns (uint256) {
        return _redeems[controller].claimableShares;
    }

    /// @inheritdoc ERC7540
    function _asyncMaxWithdraw(address owner) internal view virtual override returns (uint256) {
        return _redeems[owner].claimableAssets;
    }

    /// @inheritdoc ERC7540
    function _asyncMaxRedeem(address owner) internal view virtual override returns (uint256) {
        return _redeems[owner].claimableShares;
    }

    /// @dev Assets owed to fulfilled but unclaimed redeems.
    function _totalClaimableRedeemAssets() internal view virtual override returns (uint256) {
        return _totalClaimableAssets;
    }

    /// @dev Shares of fulfilled but unclaimed redeems.
    function _totalClaimableRedeemShares() internal view virtual override returns (uint256) {
        return _totalClaimableShares;
    }
}
