// SPDX-License-Identifier: MIT

pragma solidity ^0.8.31;

import {IERC6372} from "../../../interfaces/IERC6372.sol";
import {ERC6372Utils} from "../../../utils/ERC6372Utils.sol";
import {Math} from "../../../utils/math/Math.sol";
import {SafeCast} from "../../../utils/math/SafeCast.sol";
import {Checkpoints} from "../../../utils/structs/Checkpoints.sol";
import {Time} from "../../../utils/types/Time.sol";
import {ERC7540} from "./ERC7540.sol";

/**
 * @dev Time-delay fulfillment strategy for asynchronous redemptions.
 *
 * Extends {ERC7540} with a redeem flow where requests become **permissionlessly claimable** after a
 * configurable waiting period. No privileged fulfiller is needed — once the delay elapses, the
 * controller (or any keeper) can claim. The exchange rate is computed at claim time using the vault's
 * live {convertToAssets}.
 *
 * Production equivalents:
 * https://github.com/beefyfinance/beefy-sonic/blob/main/contracts/BeefySonic.sol[BeefySonic] (protocol-dictated SFC unbonding),
 * https://github.com/MagmaStaking/contracts-public/blob/live/src/MagmaV2.sol[MagmaV2] (admin-configurable delay),
 * https://github.com/tangle-network/tnt-core/blob/main/src/staking/LiquidDelegationVault.sol[Tangle] (protocol-dictated).
 *
 * Requests are tracked using {Checkpoints-Trace208}, storing cumulative redeem amounts keyed by
 * their maturity timepoint. The `requestId` returned by {requestRedeem} equals the absolute
 * timestamp at which the request becomes claimable (`clock() + redeemDelay(controller)`).
 *
 * Override {redeemDelay} to customize the waiting period (default: 1 hour) and {clock} to
 * change the time source (default: `block.timestamp`).
 *
 * NOTE: This module does not support temporary share custody through {_redeemShareDestination}. The constructor
 * tries to enforce that property, but the check may be insufficient if {_redeemShareDestination} reads from
 * storage that is not yet initialized when the parent's constructor runs.
 */
abstract contract ERC7540DelayRedeem is ERC7540, IERC6372 {
    using SafeCast for uint256;
    using Checkpoints for Checkpoints.Trace208;

    mapping(address controller => Checkpoints.Trace208) private _redeems;
    mapping(address controller => uint256) private _claimedRedeems;

    /// @dev Triggered if {_redeemShareDestination} is not address(0), as this is not supported by this module.
    error ERC7540DelayInvalidRedeemShareDestination();

    constructor() {
        require(_redeemShareDestination() == address(0), ERC7540DelayInvalidRedeemShareDestination());
    }

    /// @inheritdoc IERC6372
    function clock() public view virtual returns (uint48) {
        return Time.timestamp();
    }

    /// @inheritdoc IERC6372
    // solhint-disable-next-line func-name-mixedcase
    function CLOCK_MODE() public view virtual returns (string memory) {
        return ERC6372Utils.timestampClockMode(clock);
    }

    /**
     * @dev Returns the delay duration before a redeem request becomes claimable. Defaults to 1 hour.
     *
     * NOTE: For any given `controller`, the maturity timepoint `clock() + redeemDelay(controller)` MUST
     * be non-decreasing across successive {requestRedeem} calls. Overrides that shrink the delay faster
     * than `clock()` advances will cause new requests to revert until the previous maturity is reached.
     */
    function redeemDelay(address /*controller*/) public view virtual returns (uint48) {
        return 1 hours;
    }

    /// @inheritdoc ERC7540
    function _isRedeemAsync() internal pure virtual override returns (bool) {
        return true;
    }

    /**
     * @dev Pushes a new cumulative checkpoint at the maturity timepoint `requestId` (see
     * {_getRedeemRequestId}) and delegates to {ERC7540-_requestRedeem}.
     */
    function _requestRedeem(
        uint256 shares,
        address controller,
        address owner,
        uint256 requestId
    ) internal virtual override {
        if (shares > 0) {
            uint256 latest = _redeems[controller].latest();
            _redeems[controller].push(requestId.toUint48(), (shares + latest).toUint208());
        }

        super._requestRedeem(shares, controller, owner, requestId);
    }

    /// @dev Redeem Requests are identified by their maturity timepoint: the current {clock} plus {redeemDelay}.
    function _getRedeemRequestId(address controller) internal virtual override returns (uint256) {
        return clock() + redeemDelay(controller);
    }

    /// @dev Consumes `assets` from claimable redeems, returns proportional shares (rounded up).
    function _consumeClaimableWithdraw(uint256 assets, address controller) internal virtual override returns (uint256) {
        uint256 shares = Math.mulDiv(assets, maxRedeem(controller), maxWithdraw(controller), Math.Rounding.Ceil);
        _claimedRedeems[controller] += shares;
        return shares;
    }

    /// @dev Consumes `shares` from claimable redeems, returns proportional assets (rounded down).
    function _consumeClaimableRedeem(uint256 shares, address controller) internal virtual override returns (uint256) {
        uint256 assets = Math.mulDiv(shares, maxWithdraw(controller), maxRedeem(controller), Math.Rounding.Floor);
        _claimedRedeems[controller] += shares;
        return assets;
    }

    /**
     * @dev Returns the shares in Pending state for a specific `requestId` (timepoint).
     * A request is pending only if its timepoint is strictly in the future.
     */
    function _pendingRedeemRequest(
        uint256 requestId,
        address controller
    ) internal view virtual override returns (uint256) {
        unchecked {
            uint48 timepoint = requestId.toUint48();
            return
                timepoint > clock()
                    ? _readyRedeemAt(controller, timepoint) - _readyRedeemAt(controller, timepoint - 1)
                    : 0;
        }
    }

    /**
     * @dev Returns the shares in Claimable state for a specific `requestId` (timepoint).
     * A request is claimable once its timepoint has elapsed and the shares haven't been claimed yet.
     */
    function _claimableRedeemRequest(
        uint256 requestId,
        address controller
    ) internal view virtual override returns (uint256) {
        unchecked {
            uint48 timepoint = requestId.toUint48();
            return
                (timepoint == 0 || timepoint > clock())
                    ? 0
                    : _readyRedeemAt(controller, timepoint) - _readyRedeemAt(controller, timepoint - 1);
        }
    }

    /// @dev Returns the asset-equivalent of {_asyncMaxRedeem} (rounded down).
    function _asyncMaxWithdraw(address owner) internal view virtual override returns (uint256) {
        return _convertToAssets(_readyRedeemAt(owner, clock()), Math.Rounding.Floor);
    }

    /// @dev Returns the total claimable shares across all matured timepoints for `owner`.
    function _asyncMaxRedeem(address owner) internal view virtual override returns (uint256) {
        return _readyRedeemAt(owner, clock());
    }

    /**
     * @dev Internal helper: fetch the amount that is expected to be claimable at a given timepoint, if any.
     * Any amount that has already been claimed is taken into consideration.
     */
    function _readyRedeemAt(address owner, uint48 timepoint) internal view virtual returns (uint256) {
        return Math.saturatingSub(_redeems[owner].upperLookupRecent(timepoint), _claimedRedeems[owner]);
    }

    /// @dev The rate is computed at claim time, so no value is locked in Claimable requests.
    function _totalClaimableRedeemAssets() internal view virtual override returns (uint256) {
        return 0;
    }

    /// @dev The rate is computed at claim time, so no value is locked in Claimable requests.
    function _totalClaimableRedeemShares() internal view virtual override returns (uint256) {
        return 0;
    }
}
