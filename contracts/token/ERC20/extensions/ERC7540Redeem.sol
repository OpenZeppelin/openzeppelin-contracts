// SPDX-License-Identifier: MIT

pragma solidity ^0.8.26;

import {IERC7540Redeem} from "../../../interfaces/IERC7540.sol";
import {IERC4626} from "../../../interfaces/IERC4626.sol";
import {IERC20Vault} from "./IERC20Vault.sol";
import {ERC7540Operator} from "./ERC7540Operator.sol";
import {ERC165} from "../../../utils/introspection/ERC165.sol";
import {Math} from "../../../utils/math/Math.sol";

/**
 * @dev Extension of {ERC7540Operator} that implements the asynchronous redemption flow of ERC-7540.
 *
 * This contract provides the mechanisms for users to request redemptions of shares from the vault.
 * Requests go through three states:
 *
 * 1. Pending: Shares are transferred to (or burned by) the vault and recorded in `pendingRedeemRequest`
 * 2. Claimable: The vault processes the request and makes it claimable via `claimableRedeemRequest`
 * 3. Claimed: Users call the standard `withdraw` or `redeem` functions to receive their assets
 *
 * The exchange rate between shares and assets is determined when the request becomes Claimable,
 * not when the request is initially made. This allows vaults to handle redemptions that cannot be
 * processed immediately, such as those requiring unstaking periods or asset liquidation.
 *
 * Vault implementations must call {_fulfillRedeem} to transition requests from Pending to Claimable.
 *
 * NOTE: By default, shares are held in the vault during Pending state and burned at fulfillment,
 * allowing them to continue earning yield. Vaults can override {_lockSharesIn} and {_completeSharesIn}
 * to burn shares immediately at request time and do nothing (respectively), but must also override
 * {_fulfillRedeem} to use a snapshotted exchange rate to ensure correct asset calculations.
 */
abstract contract ERC7540Redeem is ERC165, ERC7540Operator, IERC7540Redeem {
    /// @dev The amount of shares requested is greater than the amount of shares pending.
    error ERC7540RedeemInsufficientPendingShares(uint256 shares, uint256 pendingShares);

    mapping(address controller => uint256) private _pendingRedeem;
    mapping(address controller => ClaimableRedeem) private _claimableRedeem;

    /**
     * @dev Struct containing the shares and corresponding assets for a claimable redeem request.
     * When a request becomes claimable via {_fulfillRedeem}, the exchange rate is locked in this struct.
     */
    struct ClaimableRedeem {
        uint256 assets;
        uint256 shares;
    }

    /// @inheritdoc IERC7540Redeem
    function pendingRedeemRequest(uint256 /* requestId */, address controller) public view virtual returns (uint256) {
        return _pendingRedeem[controller];
    }

    /// @inheritdoc IERC7540Redeem
    function claimableRedeemRequest(uint256 /* requestId */, address controller) public view virtual returns (uint256) {
        return _claimableRedeem[controller].shares;
    }

    /// @dev Assets locked in the claimable redeem request.
    function claimableRedeemRequestAssets(
        uint256 /* requestId */,
        address controller
    ) public view virtual returns (uint256) {
        return _claimableRedeem[controller].assets;
    }

    /// @inheritdoc IERC20Vault
    function maxWithdraw(address controller) public view virtual override returns (uint256) {
        return claimableRedeemRequestAssets(_redeemRequestId(controller), controller);
    }

    /// @inheritdoc IERC20Vault
    function maxRedeem(address controller) public view virtual override returns (uint256) {
        return claimableRedeemRequest(_redeemRequestId(controller), controller);
    }

    /// @inheritdoc ERC165
    function supportsInterface(
        bytes4 interfaceId
    ) public view virtual override(ERC165, ERC7540Operator) returns (bool) {
        return interfaceId == type(IERC7540Redeem).interfaceId || super.supportsInterface(interfaceId);
    }

    /// @inheritdoc IERC7540Redeem
    function requestRedeem(
        uint256 shares,
        address controller,
        address owner
    ) public virtual onlyOperatorOrController(owner, _msgSender()) returns (uint256) {
        uint256 requestId = _redeemRequestId(controller);
        _setPendingRedeem(controller, shares + pendingRedeemRequest(requestId, controller));

        // Must revert with ERC20InsufficientBalance if there's not enough balance.
        _lockSharesIn(shares, owner);
        emit RedeemRequest(controller, owner, requestId, _msgSender(), shares);
        return requestId;
    }

    /**
     * @dev Allows claiming assets from a Claimable redeem request.
     *
     * See {IERC7540Redeem-withdraw}.
     *
     * NOTE: According to ERC-7540, the `controller` parameter replaces the traditional `owner` parameter
     * from ERC-4626, and the controller MUST be `msg.sender` or have approved `msg.sender` as an operator.
     */
    function withdraw(
        uint256 assets,
        address receiver,
        address controller
    ) public virtual onlyOperatorOrController(controller, _msgSender()) returns (uint256) {
        uint256 requestId = _redeemRequestId(controller);

        // Claiming partially introduces precision loss. The user therefore receives a rounded down amount,
        // while the claimable balance is reduced by a rounded up amount.
        uint256 requestShares = claimableRedeemRequest(requestId, controller);
        uint256 requestAssets = claimableRedeemRequestAssets(requestId, controller);
        uint256 shares = Math.mulDiv(assets, requestShares, requestAssets, Math.Rounding.Floor);
        uint256 sharesUp = Math.mulDiv(assets, requestShares, requestAssets, Math.Rounding.Ceil);

        _setClaimableRedeem(
            controller,
            requestAssets - assets,
            Math.ternary(requestShares > sharesUp, requestShares - sharesUp, 0)
        );
        _transferOut(receiver, assets);

        emit IERC4626.Withdraw(_msgSender(), receiver, controller, assets, shares);
        return shares;
    }

    /**
     * @dev Allows claiming assets from a Claimable redeem request by specifying the exact amount of shares.
     *
     * See {IERC7540Redeem-redeem}.
     *
     * NOTE: According to ERC-7540, the `controller` parameter replaces the traditional `owner` parameter
     * from ERC-4626, and the controller MUST be `msg.sender` or have approved `msg.sender` as an operator.
     */
    function redeem(
        uint256 shares,
        address receiver,
        address controller
    ) public virtual onlyOperatorOrController(controller, _msgSender()) returns (uint256) {
        uint256 requestId = _redeemRequestId(controller);

        // Claiming partially introduces precision loss. The user therefore receives a rounded down amount,
        // while the claimable balance is reduced by a rounded up amount.
        uint256 requestAssets = claimableRedeemRequestAssets(requestId, controller);
        uint256 requestShares = claimableRedeemRequest(requestId, controller);
        uint256 assets = Math.mulDiv(shares, requestAssets, requestShares, Math.Rounding.Floor);
        uint256 assetsUp = Math.mulDiv(shares, requestAssets, requestShares, Math.Rounding.Ceil);

        _setClaimableRedeem(
            controller,
            Math.ternary(requestAssets > assetsUp, requestAssets - assetsUp, 0),
            requestShares - shares
        );
        _transferOut(receiver, assets);

        emit IERC4626.Withdraw(_msgSender(), receiver, controller, assets, shares);
        return assets;
    }

    /**
     * @dev Fulfills a pending redeem request by transitioning it from Pending to Claimable state.
     *
     * This internal function should be called by the vault implementation when it's ready to process
     * a redemption request. It converts the specified amount of pending shares to assets at the current
     * exchange rate and updates the claimable balance for the controller.
     *
     * The corresponding assets are held by the vault and made available for the controller to claim
     * via {withdraw} or {redeem}.
     *
     * Requirements:
     *
     * * `shares` must not exceed the pending redeem amount for the controller
     *
     * NOTE: Does not emit an event to track the fulfillment of the request.
     */
    function _fulfillRedeem(uint256 shares, address controller) internal virtual returns (uint256) {
        uint256 requestId = _redeemRequestId(controller);
        uint256 pendingShares = pendingRedeemRequest(requestId, controller);
        require(shares <= pendingShares, ERC7540RedeemInsufficientPendingShares(shares, pendingShares));

        uint256 assets = convertToAssets(shares);
        uint256 claimableAssets = claimableRedeemRequestAssets(requestId, controller);
        uint256 claimableShares = claimableRedeemRequest(requestId, controller);
        _completeSharesIn(shares, controller);
        _setClaimableRedeem(controller, claimableAssets + assets, claimableShares + shares);
        _setPendingRedeem(controller, pendingShares - shares);
        return assets;
    }

    /// @dev Sets the claimable redeem request for the controller.
    function _setClaimableRedeem(address controller, uint256 assets, uint256 shares) internal virtual {
        _claimableRedeem[controller] = ClaimableRedeem(assets, shares);
    }

    /// @dev Sets the pending redeem request for the controller.
    function _setPendingRedeem(address controller, uint256 shares) internal virtual {
        _pendingRedeem[controller] = shares;
    }

    /**
     * @dev Performs a transfer in of shares. By default, it takes the shares from the owner.
     * Used by {requestRedeem}.
     *
     * IMPORTANT: If overriding to burn shares immediately (instead of holding them in the vault),
     * you must ALSO override {_fulfillRedeem} to use a snapshotted exchange rate, since the
     * shares will no longer exist in `totalSupply()` at fulfillment time. Simply overriding
     * {_completeSharesIn} to do nothing is not sufficient.
     */
    function _lockSharesIn(uint256 shares, address owner) internal virtual {
        _update(owner, address(this), shares);
    }

    /// @dev Performs a fulfillment of a redeem request. By default, it burns the shares. Used by {_fulfillRedeem}.
    function _completeSharesIn(uint256 shares, address /* controller */) internal virtual {
        _burn(address(this), shares);
    }

    /// @dev Returns the request ID for the given redeem parameters.
    function _redeemRequestId(address /* controller */) internal view virtual returns (uint256) {
        return 0; // Assume requests are non-fungible and all have ID = 0
    }
}
