// SPDX-License-Identifier: MIT

pragma solidity ^0.8.26;

import {IERC7540Deposit} from "../../../interfaces/IERC7540.sol";
import {IERC4626} from "../../../interfaces/IERC4626.sol";
import {IERC20Vault} from "./IERC20Vault.sol";
import {ERC7540Operator} from "./ERC7540Operator.sol";
import {ERC165} from "../../../utils/introspection/ERC165.sol";
import {Math} from "../../../utils/math/Math.sol";

/**
 * @dev Extension of {ERC7540Operator} that implements the asynchronous deposit flow of ERC-7540.
 *
 * This contract provides the mechanisms for users to request deposits of assets into the vault.
 * Requests go through three states:
 *
 * 1. Pending: Assets are transferred to the vault and recorded in `pendingDepositRequest`
 * 2. Claimable: The vault processes the request and makes it claimable via `claimableDepositRequest`
 * 3. Claimed: Users call the standard `deposit` or `mint` functions to receive their shares
 *
 * The exchange rate between assets and shares is determined when the request becomes Claimable,
 * not when the request is initially made. This allows vaults to handle deposits that cannot be
 * processed immediately, such as those requiring off-chain processes or cross-chain operations.
 *
 * Vault implementations must call {_fulfillDeposit} to transition requests from Pending to Claimable.
 */
abstract contract ERC7540Deposit is ERC165, ERC7540Operator, IERC7540Deposit {
    /// @dev The amount of assets requested is greater than the amount of assets pending.
    error ERC7540DepositInsufficientPendingAssets(uint256 assets, uint256 pendingAssets);

    uint256 private _totalPendingDepositAssets;
    mapping(address controller => uint256) private _pendingDeposit;
    mapping(address controller => ClaimableDeposit) private _claimableDeposit;

    /**
     * @dev Struct containing the assets and corresponding shares for a claimable deposit request.
     * When a request becomes claimable via {_fulfillDeposit}, the exchange rate is locked in this struct.
     */
    struct ClaimableDeposit {
        uint256 assets;
        uint256 shares;
    }

    /**
     * @dev See {IERC20Vault-totalAssets}.
     *
     * Total assets pending redemption must be removed from the reported total assets
     * otherwise pending assets would be treated as yield for outstanding shares.
     */
    function totalAssets() public view virtual override returns (uint256) {
        return super.totalAssets() - _totalPendingDepositAssets;
    }

    /// @inheritdoc IERC7540Deposit
    function pendingDepositRequest(uint256 /* requestId */, address controller) public view virtual returns (uint256) {
        return _pendingDeposit[controller];
    }

    /// @inheritdoc IERC7540Deposit
    function claimableDepositRequest(
        uint256 /* requestId */,
        address controller
    ) public view virtual returns (uint256) {
        return _claimableDeposit[controller].assets;
    }

    /// @dev Shares locked in the claimable deposit request.
    function claimableDepositRequestShares(
        uint256 /* requestId */,
        address controller
    ) public view virtual returns (uint256) {
        return _claimableDeposit[controller].shares;
    }

    /// @inheritdoc IERC20Vault
    function maxDeposit(address controller) public view virtual override returns (uint256) {
        return claimableDepositRequest(_depositRequestId(controller), controller);
    }

    /// @inheritdoc IERC20Vault
    function maxMint(address controller) public view virtual override returns (uint256) {
        return claimableDepositRequestShares(_depositRequestId(controller), controller);
    }

    /// @inheritdoc ERC165
    function supportsInterface(
        bytes4 interfaceId
    ) public view virtual override(ERC165, ERC7540Operator) returns (bool) {
        return interfaceId == type(IERC7540Deposit).interfaceId || super.supportsInterface(interfaceId);
    }

    /// @inheritdoc IERC7540Deposit
    function requestDeposit(
        uint256 assets,
        address controller,
        address owner
    ) public virtual onlyOperatorOrController(owner, _msgSender()) returns (uint256) {
        uint256 requestId = _depositRequestId(controller);
        _setPendingDeposit(controller, assets + pendingDepositRequest(requestId, controller));
        _totalPendingDepositAssets += assets;

        // Must revert with ERC20InsufficientBalance or equivalent error if there's not enough balance.
        _transferIn(owner, assets);
        emit DepositRequest(controller, owner, requestId, _msgSender(), assets);
        return requestId;
    }

    /**
     * @dev Allows claiming shares from a Claimable deposit request.
     * Calls the three-argument version with `receiver` as the `controller`. Complies with ERC-4626.
     *
     * See {IERC7540Deposit-deposit}.
     */
    function deposit(uint256 assets, address receiver) public virtual returns (uint256 shares) {
        return deposit(assets, receiver, receiver);
    }

    /// @inheritdoc IERC7540Deposit
    function deposit(
        uint256 assets,
        address receiver,
        address controller
    ) public virtual onlyOperatorOrController(controller, _msgSender()) returns (uint256) {
        uint256 requestId = _depositRequestId(controller);

        // Claiming partially introduces precision loss. The user therefore receives a rounded down amount,
        // while the claimable balance is reduced by a rounded up amount.
        uint256 requestShares = claimableDepositRequestShares(requestId, controller);
        uint256 requestAssets = claimableDepositRequest(requestId, controller);
        uint256 shares = Math.mulDiv(assets, requestShares, requestAssets, Math.Rounding.Floor);
        uint256 sharesUp = Math.mulDiv(assets, requestShares, requestAssets, Math.Rounding.Ceil);

        _setClaimableDeposit(
            controller,
            requestAssets - assets,
            Math.ternary(requestShares > sharesUp, requestShares - sharesUp, 0)
        );
        _update(address(this), receiver, shares);

        emit IERC4626.Deposit(controller, receiver, assets, shares);
        return shares;
    }

    /**
     * @dev Allows claiming shares from a Claimable deposit request by specifying the exact amount of shares.
     * Calls the three-argument version with `receiver` as the `controller`. Complies with ERC-4626.
     *
     * See {IERC7540Deposit-mint}.
     */
    function mint(uint256 shares, address receiver) public virtual returns (uint256 assets) {
        return mint(shares, receiver, receiver);
    }

    /// @inheritdoc IERC7540Deposit
    function mint(
        uint256 shares,
        address receiver,
        address controller
    ) public virtual override onlyOperatorOrController(controller, _msgSender()) returns (uint256) {
        uint256 requestId = _depositRequestId(controller);

        // Claiming partially introduces precision loss. The user therefore receives a rounded down amount,
        // while the claimable balance is reduced by a rounded up amount.
        uint256 requestAssets = claimableDepositRequest(requestId, controller);
        uint256 requestShares = claimableDepositRequestShares(requestId, controller);
        uint256 assets = Math.mulDiv(shares, requestAssets, requestShares, Math.Rounding.Floor);
        uint256 assetsUp = Math.mulDiv(shares, requestAssets, requestShares, Math.Rounding.Ceil);

        _setClaimableDeposit(
            controller,
            Math.ternary(requestAssets > assetsUp, requestAssets - assetsUp, 0),
            requestShares - shares
        );
        _update(address(this), receiver, shares);

        emit IERC4626.Deposit(controller, receiver, assets, shares);
        return assets;
    }

    /**
     * @dev Fulfills a pending deposit request by transitioning it from Pending to Claimable state.
     *
     * This internal function should be called by the vault implementation when it's ready to process
     * a deposit request. It converts the specified amount of pending assets to shares at the current
     * exchange rate, mints those shares to the vault itself, and updates the claimable balance for
     * the controller.
     *
     * The shares are minted to the vault contract and held there until the controller claims them
     * via {deposit} or {mint}.
     *
     * Requirements:
     *
     * * `assets` must not exceed the pending deposit amount for the controller
     *
     * NOTE: Does not emit an event to track the fulfillment of the request.
     */
    function _fulfillDeposit(uint256 assets, address controller) internal virtual returns (uint256) {
        uint256 requestId = _depositRequestId(controller);
        uint256 pendingAssets = pendingDepositRequest(requestId, controller);
        require(assets <= pendingAssets, ERC7540DepositInsufficientPendingAssets(assets, pendingAssets));

        uint256 shares = convertToShares(assets);
        uint256 claimableAssets = claimableDepositRequest(requestId, controller);
        uint256 claimableShares = claimableDepositRequestShares(requestId, controller);
        _mint(address(this), shares);
        _setClaimableDeposit(controller, claimableAssets + assets, claimableShares + shares);
        _setPendingDeposit(controller, pendingAssets - assets);
        _totalPendingDepositAssets -= assets;
        return shares;
    }

    /// @dev Sets the claimable deposit request for the controller.
    function _setClaimableDeposit(address controller, uint256 assets, uint256 shares) internal virtual {
        _claimableDeposit[controller] = ClaimableDeposit(assets, shares);
    }

    /// @dev Sets the pending deposit request for the controller.
    function _setPendingDeposit(address controller, uint256 assets) internal virtual {
        _pendingDeposit[controller] = assets;
    }

    /// @dev Returns the request ID for the given assets, controller, and owner
    function _depositRequestId(address /* controller */) internal view virtual returns (uint256) {
        return 0; // Assume requests are non-fungible and all have ID = 0
    }
}
