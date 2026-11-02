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
 * @dev Time-delay fulfillment strategy for asynchronous deposits.
 *
 * Extends {ERC7540} with a deposit flow where requests become **permissionlessly claimable** after a
 * configurable waiting period. No privileged fulfiller is needed — once the delay elapses, the
 * controller (or any keeper) can claim. The exchange rate is computed at claim time using the vault's
 * live {convertToShares}.
 *
 * Production equivalents (redeem side):
 * https://github.com/beefyfinance/beefy-sonic/blob/main/contracts/BeefySonic.sol[BeefySonic],
 * https://github.com/MagmaStaking/contracts-public/blob/live/src/MagmaV2.sol[MagmaV2],
 * https://github.com/tangle-network/tnt-core/blob/main/src/staking/LiquidDelegationVault.sol[Tangle].
 *
 * Requests are tracked using {Checkpoints-Trace208}, storing cumulative deposit amounts keyed by
 * their maturity timepoint. The `requestId` returned by {requestDeposit} equals the absolute
 * timestamp at which the request becomes claimable (`clock() + depositDelay(controller)`).
 *
 * Override {depositDelay} to customize the waiting period (default: 1 hour) and {clock} to
 * change the time source (default: `block.timestamp`).
 *
 * NOTE: This module does not support temporary share custody through {_depositShareOrigin}. The constructor
 * tries to enforce that property, but the check may be insufficient if {_depositShareOrigin} reads from
 * storage that is not yet initialized when the parent's constructor runs
 */
abstract contract ERC7540DelayDeposit is ERC7540, IERC6372 {
    using SafeCast for uint256;
    using Checkpoints for Checkpoints.Trace208;

    mapping(address controller => Checkpoints.Trace208) private _deposits;
    mapping(address controller => uint256) private _claimedDeposits;

    /// @dev Triggered if {_depositShareOrigin} is not address(0), as this is not supported by this module.
    error ERC7540DelayInvalidDepositShareOrigin();

    constructor() {
        require(_depositShareOrigin() == address(0), ERC7540DelayInvalidDepositShareOrigin());
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
     * @dev Returns the delay duration before a deposit request becomes claimable. Defaults to 1 hour.
     *
     * NOTE: For any given `controller`, the maturity timepoint `clock() + depositDelay(controller)` MUST
     * be non-decreasing across successive {requestDeposit} calls. Overrides that shrink the delay faster
     * than `clock()` advances will cause new requests to revert until the previous maturity is reached.
     */
    function depositDelay(address /*controller*/) public view virtual returns (uint48) {
        return 1 hours;
    }

    /// @inheritdoc ERC7540
    function _isDepositAsync() internal pure virtual override returns (bool) {
        return true;
    }

    /**
     * @dev Delegates to {ERC7540-_requestDeposit}, then pushes a new cumulative checkpoint at the maturity
     * timepoint `requestId` (see {_getDepositRequestId}).
     */
    function _requestDeposit(
        uint256 assets,
        address controller,
        address owner,
        uint256 requestId
    ) internal virtual override {
        // Transfer the assets first (see {ERC7540-_requestDeposit}), so that a reentrancy through the asset
        // observes neither the assets nor the controller's updated checkpoints.
        super._requestDeposit(assets, controller, owner, requestId);

        if (assets > 0) {
            uint256 latest = _deposits[controller].latest();
            _deposits[controller].push(requestId.toUint48(), (assets + latest).toUint208());
        }
    }

    /// @dev Deposit Requests are identified by their maturity timepoint: the current {clock} plus {depositDelay}.
    function _getDepositRequestId(address controller) internal virtual override returns (uint256) {
        return clock() + depositDelay(controller);
    }

    /**
     * @dev Consumes `assets` from claimable deposits, returns proportional shares (rounded down).
     *
     * Requirements:
     *
     * * {maxMint} must not be 0 for `controller`. Panics with division by zero otherwise.
     */
    function _consumeClaimableDeposit(uint256 assets, address controller) internal virtual override returns (uint256) {
        uint256 shares = Math.mulDiv(assets, maxMint(controller), maxDeposit(controller), Math.Rounding.Floor);
        _claimedDeposits[controller] += assets;
        return shares;
    }

    /// @dev Consumes `shares` from claimable deposits, returns proportional assets (rounded up).
    function _consumeClaimableMint(uint256 shares, address controller) internal virtual override returns (uint256) {
        uint256 assets = Math.mulDiv(shares, maxDeposit(controller), maxMint(controller), Math.Rounding.Ceil);
        _claimedDeposits[controller] += assets;
        return assets;
    }

    /**
     * @dev Returns the assets in Pending state for a specific `requestId` (timepoint).
     * A request is pending only if its timepoint is strictly in the future.
     */
    function _pendingDepositRequest(
        uint256 requestId,
        address controller
    ) internal view virtual override returns (uint256) {
        unchecked {
            uint48 timepoint = requestId.toUint48();
            return
                timepoint > clock()
                    ? _readyDepositAt(controller, timepoint) - _readyDepositAt(controller, timepoint - 1)
                    : 0;
        }
    }

    /**
     * @dev Returns the assets in Claimable state for a specific `requestId` (timepoint).
     * A request is claimable once its timepoint has elapsed and the assets haven't been claimed yet.
     */
    function _claimableDepositRequest(
        uint256 requestId,
        address controller
    ) internal view virtual override returns (uint256) {
        unchecked {
            uint48 timepoint = requestId.toUint48();
            return
                (timepoint == 0 || timepoint > clock())
                    ? 0
                    : _readyDepositAt(controller, timepoint) - _readyDepositAt(controller, timepoint - 1);
        }
    }

    /// @dev Returns the total claimable assets across all matured timepoints for `owner`.
    function _asyncMaxDeposit(address owner) internal view virtual override returns (uint256) {
        return _readyDepositAt(owner, clock());
    }

    /// @dev Returns the share-equivalent of {_asyncMaxDeposit} (rounded down).
    function _asyncMaxMint(address owner) internal view virtual override returns (uint256) {
        return _convertToShares(_readyDepositAt(owner, clock()), Math.Rounding.Floor);
    }

    /**
     * @dev Internal helper: fetch the amount that is expected to be claimable at a given timepoint, if any.
     * Any amount that has already been claimed is taken into consideration.
     */
    function _readyDepositAt(address owner, uint48 timepoint) internal view virtual returns (uint256) {
        return Math.saturatingSub(_deposits[owner].upperLookupRecent(timepoint), _claimedDeposits[owner]);
    }

    /// @dev The rate is computed at claim time, so no value is locked in Claimable requests.
    function _totalClaimableDepositAssets() internal view virtual override returns (uint256) {
        return 0;
    }

    /// @dev The rate is computed at claim time, so no value is locked in Claimable requests.
    function _totalClaimableDepositShares() internal view virtual override returns (uint256) {
        return 0;
    }
}
