// SPDX-License-Identifier: MIT

pragma solidity ^0.8.31;

import {IERC4626} from "../../../interfaces/IERC4626.sol";
import {IERC7540, IERC7540Operator, IERC7540Deposit, IERC7540Redeem} from "../../../interfaces/IERC7540.sol";
import {IERC7575, IERC7575Share} from "../../../interfaces/IERC7575.sol";
import {IERC165, ERC165} from "../../../utils/introspection/ERC165.sol";
import {Math} from "../../../utils/math/Math.sol";
import {IERC20, IERC20Metadata, ERC20} from "../ERC20.sol";
import {SafeERC20} from "../utils/SafeERC20.sol";
import {ERC4626} from "./ERC4626.sol";

/**
 * @dev Implementation of the ERC-7540 "Asynchronous ERC-4626 Tokenized Vaults" as defined in
 * https://eips.ethereum.org/EIPS/eip-7540[ERC-7540].
 *
 * This abstract contract provides a single base for building vaults with asynchronous deposit and/or redemption
 * flows on top of ERC-4626. It integrates operator management ({IERC7540Operator}), the full ERC-4626 vault
 * interface, and routing logic that delegates to either synchronous (standard ERC-4626) or asynchronous paths
 * depending on the return value of {_isDepositAsync} and {_isRedeemAsync}.
 *
 * Subcontracts choose their async behavior by overriding two `internal pure` boolean selectors:
 *
 * * {_isDepositAsync}: when `true`, the deposit side uses the Request lifecycle (Pending -> Claimable -> Claimed).
 * * {_isRedeemAsync}: when `true`, the redeem side uses the Request lifecycle.
 *
 * Each async path requires a fulfillment strategy that implements the virtual hooks declared in this contract
 * (e.g. {_consumeClaimableDeposit}, {_pendingDepositRequest}, {_asyncMaxDeposit}, etc.).
 *
 * Deposit and redeem strategies are independent: a vault can combine any deposit strategy with any redeem
 * strategy (e.g. delay-based deposits with admin-based redeems).
 *
 * Share custody during the async lifecycle is configurable via {_depositShareOrigin} and
 * {_redeemShareDestination}. When these return `address(0)` (the default), shares are minted/burned
 * at claim time. When they return a non-zero address, shares are pre-minted to (or transferred to)
 * that address at fulfillment time and then transferred to the receiver on claim.
 *
 * [NOTE]
 * ====
 * When implementing a custom fulfillment strategy, the following virtual hooks MUST be overridden for each
 * async side enabled:
 *
 * * Async deposits: {_getDepositRequestId}, {_pendingDepositRequest}, {_claimableDepositRequest},
 * {_consumeClaimableDeposit}, {_consumeClaimableMint}, {_asyncMaxDeposit}, {_asyncMaxMint},
 * {_totalClaimableDepositAssets}, {_totalClaimableDepositShares}.
 *
 * * Async redeems: {_getRedeemRequestId}, {_pendingRedeemRequest}, {_claimableRedeemRequest},
 * {_consumeClaimableWithdraw}, {_consumeClaimableRedeem}, {_asyncMaxWithdraw}, {_asyncMaxRedeem},
 * {_totalClaimableRedeemAssets}, {_totalClaimableRedeemShares}.
 *
 * The `_get*RequestId` and `_totalClaimable*` hooks are also required for synchronous sides, where they
 * return 0.
 * ====
 *
 * [CAUTION]
 * ====
 * ERC-7540 introduces operator permissions that allow operators to manage requests on behalf of controllers.
 * An operator approved by a controller can request deposits using the controller's assets, request redemptions
 * using the controller's shares, and claim assets or shares on behalf of the controller. Users should only
 * approve operators they fully trust with both their assets and shares.
 * ====
 *
 * [CAUTION]
 * ====
 * This contract assumes the underlying `asset` is a well-behaved ERC-20: transfers move exactly the requested
 * amount, balances do not change without explicit transfers, and `balanceOf` reports faithfully. Fee-on-transfer,
 * rebasing, and similar non-standard asset behaviors are out of scope. When the asset misbehaves, internal
 * accounting (notably {totalAssets}) can revert and freeze claim paths that depend on live conversions.
 * ====
 */
abstract contract ERC7540 is ERC20, IERC4626, ERC165, IERC7540, IERC7575Share {
    using Math for uint256;

    IERC20 private immutable _asset;
    uint8 private immutable _underlyingDecimals;

    mapping(address owner => mapping(address controller => bool)) private _isOperator;
    uint256 private _totalPendingDepositAssets;
    uint256 private _totalPendingRedeemShares;

    /// @dev The `operator` is not the caller or an approved operator of the `controller`.
    error ERC7540InvalidOperator(address controller, address operator);

    /// @dev The `controller` cannot set (or unset) itself as its own operator.
    error ERC7540InvalidSelfOperator(address controller);

    /// @dev A deposit Request was attempted but {_isDepositAsync} returns `false`.
    error ERC7540SyncDeposit();

    /// @dev A synchronous deposit preview was attempted but {_isDepositAsync} returns `true`.
    error ERC7540AsyncDeposit();

    /// @dev A redeem Request was attempted but {_isRedeemAsync} returns `false`.
    error ERC7540SyncRedeem();

    /// @dev A synchronous redeem preview was attempted but {_isRedeemAsync} returns `true`.
    error ERC7540AsyncRedeem();

    /// @dev Neither {_isDepositAsync} nor {_isRedeemAsync} returns `true`.
    error ERC7540MissingAsync();

    /// @dev Invalid attempt at minting shares on a deposit fulfill when configuration mints them during claim.
    error ERC7540UnauthorizedMintSharesOnDepositFulfill();

    /// @dev Invalid attempt at burning shares on a redeem fulfill when configuration burns them during request.
    error ERC7540UnauthorizedBurnSharesOnRedeemFulfill();

    /// @dev The vault's asset balance does not cover the assets of pending deposits and Claimable redeems.
    error ERC7540InsufficientAssets();

    /**
     * @dev Sets the underlying asset contract. This must be an ERC-20-compatible contract.
     *
     * Caches the asset's `decimals()` value at construction time. If the call fails (e.g. the asset has not
     * been created yet), a default of 18 is used.
     *
     * Requirements:
     *
     * * At least one of {_isDepositAsync} or {_isRedeemAsync} must return `true`.
     *
     * NOTE: Either {_isDepositAsync} or {_isRedeemAsync} must return `true`. Use {ERC4626} otherwise.
     */
    constructor(IERC20 asset_) {
        require(_isDepositAsync() || _isRedeemAsync(), ERC7540MissingAsync());
        (bool success, uint8 assetDecimals) = SafeERC20.tryGetDecimals(asset_);
        _underlyingDecimals = success ? assetDecimals : 18;
        _asset = asset_;
    }

    /**
     * @dev See {IERC165-supportsInterface}.
     *
     * Reports support for {IERC7540Operator} unconditionally. Support for {IERC7540Deposit} and
     * {IERC7540Redeem} is conditional on the corresponding async selector returning `true`.
     */
    function supportsInterface(bytes4 interfaceId) public view virtual override(IERC165, ERC165) returns (bool) {
        return
            interfaceId == (type(IERC4626).interfaceId ^ type(IERC7575).interfaceId) || // ERC7575
            interfaceId == type(IERC7540Operator).interfaceId ||
            (interfaceId == type(IERC7540Deposit).interfaceId && _isDepositAsync()) ||
            (interfaceId == type(IERC7540Redeem).interfaceId && _isRedeemAsync()) ||
            (interfaceId == type(IERC7575Share).interfaceId && share() == address(this)) ||
            super.supportsInterface(interfaceId);
    }

    /**
     * @dev Modifier that enforces operator-or-controller authorization.
     *
     * When `async` is `false` the check is skipped, which allows the standard ERC-4626 flow where
     * `msg.sender` is the caller and no controller/operator distinction exists.
     */
    modifier onlyOperatorOrController(bool async, address controller, address operator) {
        _checkOperatorOrController(async, controller, operator);
        _;
    }

    /// @inheritdoc IERC7540Operator
    function isOperator(address controller, address operator) public view returns (bool status) {
        return _isOperator[controller][operator];
    }

    /// @inheritdoc IERC7540Operator
    function setOperator(address operator, bool approved) public returns (bool) {
        _setOperator(_msgSender(), operator, approved);
        return true;
    }

    /**
     * @dev Sets the `operator` approval status for `controller` to `approved`.
     *
     * Requirements:
     *
     * * `operator` must not be the `controller`. A controller always has unrestricted access to its own
     *   tokens and requests, and that access cannot be revoked.
     *
     * Emits an {IERC7540Operator-OperatorSet} event.
     */
    function _setOperator(address controller, address operator, bool approved) internal {
        require(controller != operator, ERC7540InvalidSelfOperator(controller));
        _isOperator[controller][operator] = approved;
        emit OperatorSet(controller, operator, approved);
    }

    /**
     * @dev Reverts with {ERC7540InvalidOperator} if `operator` is not the `controller` and is not
     * approved as an operator for `controller`. When `async` is `false` the check is a no-op,
     * preserving standard ERC-4626 authorization semantics.
     */
    function _checkOperatorOrController(bool async, address controller, address operator) internal view virtual {
        require(
            !async || controller == operator || isOperator(controller, operator),
            ERC7540InvalidOperator(controller, operator)
        );
    }

    /**
     * @dev Decimals are computed by adding the decimal offset on top of the underlying asset's decimals. This
     * "original" value is cached during construction of the vault contract. If this read operation fails (e.g., the
     * asset has not been created yet), a default of 18 is used to represent the underlying asset's decimals.
     *
     * See {IERC20Metadata-decimals}.
     */
    function decimals() public view virtual override(IERC20Metadata, ERC20) returns (uint8) {
        return _underlyingDecimals + _decimalsOffset();
    }

    /// @inheritdoc IERC4626
    function asset() public view virtual returns (address) {
        return address(_asset);
    }

    /// @inheritdoc IERC7575
    function share() public view virtual returns (address) {
        return address(this);
    }

    /// @inheritdoc IERC7575Share
    function vault(address asset_) public view virtual returns (address) {
        return share() == address(this) && asset_ == asset() ? address(this) : address(0);
    }

    /**
     * @dev See {IERC4626-totalAssets}.
     *
     * Pending deposit assets are subtracted from the vault's token balance, since they have not yet been
     * converted into shares and must not be treated as yield for outstanding shareholders. Requests that
     * were fulfilled at a locked rate but not yet claimed are accounted as settled: the assets of Claimable
     * deposits ({_totalClaimableDepositAssets}) are added back, and the assets owed to Claimable redeems
     * ({_totalClaimableRedeemAssets}) are subtracted.
     *
     * NOTE: Internal flows preserve the invariant `balanceOf(asset, vault) + _totalClaimableDepositAssets() >=
     * totalPendingDepositAssets() + _totalClaimableRedeemAssets()` for any well-behaved ERC-20 (see
     * {_isSolvent}). Assets with transfer fees, negative rebases, or externally-mutable balances can violate
     * it and cause this function to revert with an underflow. Strategies that read {totalAssets} on the claim
     * path become uncallable in that state.
     */
    function totalAssets() public view virtual override returns (uint256) {
        return
            IERC20(asset()).balanceOf(address(this)) +
            _totalClaimableDepositAssets() -
            _totalClaimableRedeemAssets() -
            totalPendingDepositAssets();
    }

    /**
     * @dev Returns whether the vault's asset balance covers the assets of pending deposits and the assets owed
     * to Claimable redeems, i.e. whether {totalAssets} does not underflow.
     *
     * Checked by strategies after fulfilling redeem Requests at a locked rate, which revert with
     * {ERC7540InsufficientAssets} if it returns false, so that a fulfillment promising more assets than the vault
     * holds reverts instead of breaking {totalAssets} for the whole vault. Fulfillers must fund the vault before
     * fulfilling.
     *
     * NOTE: Vaults that override {totalAssets} to account for assets held outside the vault (e.g. deployed in a
     * strategy) should override this function accordingly.
     */
    function _isSolvent() internal view virtual returns (bool) {
        return
            IERC20(asset()).balanceOf(address(this)) + _totalClaimableDepositAssets() >=
            totalPendingDepositAssets() + _totalClaimableRedeemAssets();
    }

    /**
     * @dev Total number of shares backing {totalAssets}, used by the vault's conversions in place of
     * {totalSupply}.
     *
     * Adds {totalPendingRedeemShares} to the ERC-20 supply. When shares are burned at request time
     * (i.e. {_redeemShareDestination} returns `address(0)`), pending redeem shares are removed from
     * the on-chain supply but still logically outstanding until fulfilled; this function compensates.
     * Requests that were fulfilled at a locked rate but not yet claimed are accounted as settled: shares
     * owed to Claimable deposits ({_totalClaimableDepositShares}) are added, and shares of Claimable
     * redeems ({_totalClaimableRedeemShares}) are subtracted.
     *
     * NOTE: {totalSupply} is left unchanged and always equals the sum of all ERC-20 balances, so it can
     * differ from this value while requests are in flight. Integrators pricing shares should use
     * {convertToAssets} rather than `totalAssets() / totalSupply()`.
     */
    function _totalOutstandingShares() internal view virtual returns (uint256) {
        return
            totalSupply() + totalPendingRedeemShares() + _totalClaimableDepositShares() - _totalClaimableRedeemShares();
    }

    /**
     * @dev See {IERC7540Deposit-pendingDepositRequest}.
     *
     * Requirements:
     *
     * * {_isDepositAsync} must return `true`.
     */
    function pendingDepositRequest(uint256 requestId, address controller) public view returns (uint256) {
        return _isDepositAsync() ? _pendingDepositRequest(requestId, controller) : 0;
    }

    /**
     * @dev See {IERC7540Deposit-claimableDepositRequest}.
     *
     * Requirements:
     *
     * * {_isDepositAsync} must return `true`.
     */
    function claimableDepositRequest(uint256 requestId, address controller) public view returns (uint256) {
        return _isDepositAsync() ? _claimableDepositRequest(requestId, controller) : 0;
    }

    /**
     * @dev See {IERC7540Redeem-pendingRedeemRequest}.
     *
     * Requirements:
     *
     * * {_isRedeemAsync} must return `true`.
     */
    function pendingRedeemRequest(uint256 requestId, address controller) public view returns (uint256) {
        return _isRedeemAsync() ? _pendingRedeemRequest(requestId, controller) : 0;
    }

    /**
     * @dev See {IERC7540Redeem-claimableRedeemRequest}.
     *
     * Requirements:
     *
     * * {_isRedeemAsync} must return `true`.
     */
    function claimableRedeemRequest(uint256 requestId, address controller) public view returns (uint256) {
        return _isRedeemAsync() ? _claimableRedeemRequest(requestId, controller) : 0;
    }

    /// @dev Returns the total amount of underlying assets currently pending in deposit Requests.
    function totalPendingDepositAssets() public view virtual returns (uint256) {
        return _totalPendingDepositAssets;
    }

    /// @dev Returns the total amount of vault shares currently pending in redeem Requests.
    function totalPendingRedeemShares() public view virtual returns (uint256) {
        return _totalPendingRedeemShares;
    }

    /// @inheritdoc IERC4626
    function convertToShares(uint256 assets) public view virtual returns (uint256) {
        return _convertToShares(assets, Math.Rounding.Floor);
    }

    /// @inheritdoc IERC4626
    function convertToAssets(uint256 shares) public view virtual returns (uint256) {
        return _convertToAssets(shares, Math.Rounding.Floor);
    }

    /**
     * @dev See {IERC4626-maxDeposit}.
     *
     * When the deposit flow is synchronous, returns `type(uint256).max` (no vault-imposed limit).
     * When async, delegates to {_asyncMaxDeposit} which must be provided by the fulfillment strategy.
     */
    function maxDeposit(address owner) public view virtual returns (uint256) {
        return _isDepositAsync() ? _asyncMaxDeposit(owner) : type(uint256).max;
    }

    /**
     * @dev See {IERC4626-maxMint}.
     *
     * When the deposit flow is synchronous, returns `type(uint256).max`.
     * When async, delegates to {_asyncMaxMint}.
     */
    function maxMint(address owner) public view virtual returns (uint256) {
        return _isDepositAsync() ? _asyncMaxMint(owner) : type(uint256).max;
    }

    /**
     * @dev See {IERC4626-maxWithdraw}.
     *
     * When the redeem flow is synchronous, returns the asset-equivalent of the owner's share balance.
     * When async, delegates to {_asyncMaxWithdraw}.
     */
    function maxWithdraw(address owner) public view virtual returns (uint256) {
        return _isRedeemAsync() ? _asyncMaxWithdraw(owner) : previewRedeem(maxRedeem(owner));
    }

    /**
     * @dev See {IERC4626-maxRedeem}.
     *
     * When the redeem flow is synchronous, returns the owner's share balance.
     * When async, delegates to {_asyncMaxRedeem}.
     */
    function maxRedeem(address owner) public view virtual returns (uint256) {
        return _isRedeemAsync() ? _asyncMaxRedeem(owner) : balanceOf(owner);
    }

    /**
     * @dev See {IERC4626-previewDeposit}.
     *
     * MUST revert when {_isDepositAsync} returns `true`, per the ERC-7540 specification which
     * mandates that preview functions revert for async flows.
     */
    function previewDeposit(uint256 assets) public view virtual returns (uint256) {
        require(!_isDepositAsync(), ERC7540AsyncDeposit());
        return _convertToShares(assets, Math.Rounding.Floor);
    }

    /**
     * @dev See {IERC4626-previewMint}.
     *
     * MUST revert when {_isDepositAsync} returns `true`.
     */
    function previewMint(uint256 shares) public view virtual returns (uint256) {
        require(!_isDepositAsync(), ERC7540AsyncDeposit());
        return _convertToAssets(shares, Math.Rounding.Ceil);
    }

    /**
     * @dev See {IERC4626-previewWithdraw}.
     *
     * MUST revert when {_isRedeemAsync} returns `true`.
     */
    function previewWithdraw(uint256 assets) public view virtual returns (uint256) {
        require(!_isRedeemAsync(), ERC7540AsyncRedeem());
        return _convertToShares(assets, Math.Rounding.Ceil);
    }

    /**
     * @dev See {IERC4626-previewRedeem}.
     *
     * MUST revert when {_isRedeemAsync} returns `true`.
     */
    function previewRedeem(uint256 shares) public view virtual returns (uint256) {
        require(!_isRedeemAsync(), ERC7540AsyncRedeem());
        return _convertToAssets(shares, Math.Rounding.Floor);
    }

    /**
     * @dev See {IERC7540Deposit-requestDeposit}.
     *
     * Transfers `assets` from `owner` into the vault and submits a deposit Request for `controller`.
     * The Request enters Pending state, with the `requestId` returned by {_getDepositRequestId}.
     *
     * Requirements:
     *
     * * {_isDepositAsync} must return `true`.
     * * `owner` must be `msg.sender` or `msg.sender` must be an approved operator of `owner`.
     * * `owner` must have approved the vault for at least `assets` of the underlying token.
     *
     * NOTE: The `controller` is the only address authorized to claim the resulting Request. Passing an address
     * with no claim authority (e.g. `address(0)`, `0x...dead`) or any contract that cannot itself call
     * {deposit}/{mint} or designate an operator via {setOperator} will permanently lock the committed
     * `assets`, since claims are gated by {onlyOperatorOrController} on `controller` and there is no
     * cancellation path. Callers are responsible for supplying a controller capable of authorizing claims.
     */
    function requestDeposit(
        uint256 assets,
        address controller,
        address owner
    ) public virtual onlyOperatorOrController(_isDepositAsync(), owner, _msgSender()) returns (uint256) {
        uint256 requestId = _getDepositRequestId(controller);
        _requestDeposit(assets, controller, owner, requestId);
        return requestId;
    }

    /**
     * @dev See {IERC4626-deposit}. Calls the three-argument overload with `msg.sender` as `controller`.
     *
     * NOTE: This function is `payable` as declared by {IERC4626}, but rejects any native value.
     */
    function deposit(uint256 assets, address receiver) public payable virtual override returns (uint256) {
        require(msg.value == 0, ERC4626.ERC4626UnexpectedNativeValue(msg.value));
        return deposit(assets, receiver, _msgSender());
    }

    /**
     * @dev See {IERC7540Deposit-deposit}.
     *
     * When async, claims `assets` worth of shares from a Claimable deposit Request controlled by `controller`,
     * and transfers the resulting shares to `receiver`. When sync, behaves as standard ERC-4626 deposit.
     *
     * NOTE: When {_isDepositAsync} is `false`, the `controller` parameter is ignored and `receiver` is used
     * for limit checks, matching standard ERC-4626 semantics.
     *
     * Requirements:
     *
     * * `assets` must not exceed {maxDeposit} for the relevant account.
     * * When async, `msg.sender` must be `controller` or an approved operator of `controller`.
     */
    function deposit(
        uint256 assets,
        address receiver,
        address controller
    ) public virtual onlyOperatorOrController(_isDepositAsync(), controller, _msgSender()) returns (uint256) {
        // Note: if _isDepositAsync is false, controller is ignored.
        uint256 maxAssets = maxDeposit(_isDepositAsync() ? controller : receiver);
        if (assets > maxAssets) {
            revert ERC4626.ERC4626ExceededMaxDeposit(_isDepositAsync() ? controller : receiver, assets, maxAssets);
        }

        uint256 shares = _isDepositAsync() ? _consumeClaimableDeposit(assets, controller) : previewDeposit(assets);
        _deposit(_isDepositAsync() ? controller : _msgSender(), receiver, assets, shares);
        return shares;
    }

    /**
     * @dev See {IERC4626-mint}. Calls the three-argument overload with `msg.sender` as `controller`.
     *
     * NOTE: This function is `payable` as declared by {IERC4626}, but rejects any native value.
     */
    function mint(uint256 shares, address receiver) public payable virtual override returns (uint256) {
        require(msg.value == 0, ERC4626.ERC4626UnexpectedNativeValue(msg.value));
        return mint(shares, receiver, _msgSender());
    }

    /**
     * @dev See {IERC7540Deposit-mint}.
     *
     * When async, claims exactly `shares` from a Claimable deposit Request controlled by `controller`,
     * and transfers them to `receiver`. When sync, behaves as standard ERC-4626 mint.
     *
     * NOTE: When {_isDepositAsync} is `false`, the `controller` parameter is ignored.
     *
     * Requirements:
     *
     * * `shares` must not exceed {maxMint} for the relevant account.
     * * When async, `msg.sender` must be `controller` or an approved operator of `controller`.
     */
    function mint(
        uint256 shares,
        address receiver,
        address controller
    ) public virtual onlyOperatorOrController(_isDepositAsync(), controller, _msgSender()) returns (uint256) {
        // Note: if _isDepositAsync is false, controller is ignored.
        uint256 maxShares = maxMint(_isDepositAsync() ? controller : receiver);
        if (shares > maxShares) {
            revert ERC4626.ERC4626ExceededMaxMint(_isDepositAsync() ? controller : receiver, shares, maxShares);
        }

        uint256 assets = _isDepositAsync() ? _consumeClaimableMint(shares, controller) : previewMint(shares);
        _deposit(_isDepositAsync() ? controller : _msgSender(), receiver, assets, shares);
        return assets;
    }

    /**
     * @dev See {IERC7540Redeem-requestRedeem}.
     *
     * Assumes control of `shares` from `owner` and submits a redeem Request for `controller`.
     * The Request enters Pending state, with the `requestId` returned by {_getRedeemRequestId}.
     *
     * Authorization for a `msg.sender` not equal to `owner` may come from either ERC-20 approval
     * over the shares of `owner` or from operator approval (see {IERC7540Operator}). This is
     * consistent with the approach described in ERC-6909.
     *
     * Requirements:
     *
     * * {_isRedeemAsync} must return `true`.
     *
     * NOTE: The `controller` is the only address authorized to claim the resulting Request. Passing an address
     * with no claim authority (e.g. `address(0)`, `0x...dead`) or any contract that cannot itself call
     * {withdraw}/{redeem} or designate an operator via {setOperator} will permanently lock the committed
     * `shares`, since claims are gated by {onlyOperatorOrController} on `controller` and there is no
     * cancellation path. Callers are responsible for supplying a controller capable of authorizing claims.
     */
    function requestRedeem(uint256 shares, address controller, address owner) public virtual returns (uint256) {
        uint256 requestId = _getRedeemRequestId(controller);
        _requestRedeem(shares, controller, owner, requestId);
        return requestId;
    }

    /**
     * @dev See {IERC4626-withdraw}.
     *
     * When async, claims `assets` from a Claimable redeem Request controlled by `ownerOrController`,
     * and transfers the underlying assets to `receiver`. When sync, behaves as standard ERC-4626 withdraw.
     *
     * NOTE: Per ERC-7540, when async the `ownerOrController` parameter acts as the `controller`
     * (replacing the traditional ERC-4626 `owner` role).
     *
     * Requirements:
     *
     * * `assets` must not exceed {maxWithdraw} for `ownerOrController`.
     * * When async, `msg.sender` must be `ownerOrController` or an approved operator.
     * * When sync, `msg.sender` must be `ownerOrController` or have sufficient ERC-20 allowance.
     */
    function withdraw(
        uint256 assets,
        address receiver,
        address ownerOrController
    ) public virtual onlyOperatorOrController(_isRedeemAsync(), ownerOrController, _msgSender()) returns (uint256) {
        uint256 maxAssets = maxWithdraw(ownerOrController);
        if (assets > maxAssets) {
            revert ERC4626.ERC4626ExceededMaxWithdraw(ownerOrController, assets, maxAssets);
        }

        uint256 shares = _isRedeemAsync()
            ? _consumeClaimableWithdraw(assets, ownerOrController)
            : previewWithdraw(assets);
        _withdraw(_msgSender(), receiver, ownerOrController, assets, shares);
        return shares;
    }

    /**
     * @dev See {IERC4626-redeem}.
     *
     * When async, claims `shares` from a Claimable redeem Request controlled by `ownerOrController`,
     * and transfers the corresponding underlying assets to `receiver`. When sync, behaves as standard
     * ERC-4626 redeem.
     *
     * NOTE: Per ERC-7540, when async the `ownerOrController` parameter acts as the `controller`.
     *
     * Requirements:
     *
     * * `shares` must not exceed {maxRedeem} for `ownerOrController`.
     * * When async, `msg.sender` must be `ownerOrController` or an approved operator.
     * * When sync, `msg.sender` must be `ownerOrController` or have sufficient ERC-20 allowance.
     */
    function redeem(
        uint256 shares,
        address receiver,
        address ownerOrController
    ) public virtual onlyOperatorOrController(_isRedeemAsync(), ownerOrController, _msgSender()) returns (uint256) {
        uint256 maxShares = maxRedeem(ownerOrController);
        if (shares > maxShares) {
            revert ERC4626.ERC4626ExceededMaxRedeem(ownerOrController, shares, maxShares);
        }

        uint256 assets = _isRedeemAsync() ? _consumeClaimableRedeem(shares, ownerOrController) : previewRedeem(shares);
        _withdraw(_msgSender(), receiver, ownerOrController, assets, shares);
        return assets;
    }

    /**
     * @dev Internal conversion function (from assets to shares) with support for rounding direction.
     *
     * Uses virtual shares and virtual assets to mitigate the inflation attack vector described in
     * https://docs.openzeppelin.com/contracts/5.x/erc4626#inflation-attack[ERC-4626 security considerations].
     * The offset is configurable via {_decimalsOffset}.
     */
    function _convertToShares(uint256 assets, Math.Rounding rounding) internal view virtual returns (uint256) {
        return assets.mulDiv(_totalOutstandingShares() + 10 ** _decimalsOffset(), totalAssets() + 1, rounding);
    }

    /**
     * @dev Internal conversion function (from shares to assets) with support for rounding direction.
     */
    function _convertToAssets(uint256 shares, Math.Rounding rounding) internal view virtual returns (uint256) {
        return shares.mulDiv(totalAssets() + 1, _totalOutstandingShares() + 10 ** _decimalsOffset(), rounding);
    }

    /**
     * @dev Internal handler for deposit Requests. Increments {totalPendingDepositAssets}, transfers
     * assets from `owner` into the vault, and emits {IERC7540Deposit-DepositRequest}. {requestDeposit} uses
     * the `requestId` returned by {_getDepositRequestId}.
     *
     * NOTE: Strategies that track Requests separately (e.g. {ERC7540DelayDeposit}, {ERC7540EpochDeposit}) record the
     * Request under `requestId`. Other callers of this function are expected to pass the value returned by
     * {_getDepositRequestId}, so that the Request is recorded under the current maturity timepoint or epoch.
     *
     * Strategy extensions (e.g. {ERC7540AdminDeposit}) should override this to record per-controller
     * pending state after calling `super._requestDeposit(...)`.
     *
     * NOTE: {totalPendingDepositAssets} is incremented after {_transferIn} so that {totalAssets} stays
     * consistent if the asset has a pre-transfer hook (e.g. ERC-777 `tokensToSend`). Incrementing it before
     * the transfer would let such a hook observe the new liability without the matching balance, and claim
     * against a depressed {totalAssets} at an inflated rate.
     *
     * Requirements:
     *
     * * {_isDepositAsync} must return `true`, otherwise reverts with {ERC7540SyncDeposit}.
     */
    function _requestDeposit(uint256 assets, address controller, address owner, uint256 requestId) internal virtual {
        require(_isDepositAsync(), ERC7540SyncDeposit());

        // If asset() is ERC-777, `transferFrom` can trigger a reentrancy BEFORE the transfer happens through the
        // `tokensToSend` hook. Pending accounting must therefore be updated after the transfer, so that any
        // reentrancy observes neither the assets nor the corresponding liability, which is a valid state.
        //
        // Must revert with ERC20InsufficientBalance or equivalent error if there's not enough balance.
        // slither-disable-next-line reentrancy-no-eth
        _transferIn(owner, assets);
        _totalPendingDepositAssets += assets;

        emit DepositRequest(controller, owner, requestId, _msgSender(), assets);
    }

    /**
     * @dev Mints shares to {_depositShareOrigin} as part of deposit fulfillment when using the
     * pre-mint share custody model. Decrements {totalPendingDepositAssets} by `assets`.
     *
     * IMPORTANT: This function requires {_depositShareOrigin} to return a non-zero address.
     * When {_depositShareOrigin} returns `address(0)`, shares are minted directly at claim time
     * inside {_deposit} and this function must not be called.
     */
    function _mintSharesOnDepositFulfill(uint256 assets, uint256 shares) internal virtual {
        require(_depositShareOrigin() != address(0), ERC7540UnauthorizedMintSharesOnDepositFulfill());
        _totalPendingDepositAssets -= assets;
        _mint(_depositShareOrigin(), shares);
    }

    /**
     * @dev Common workflow for deposit and mint claim operations.
     *
     * Handles three cases depending on the vault configuration:
     *
     * 1. **Synchronous** ({_isDepositAsync} returns `false`): transfers assets from `callerOrController` into the vault
     *    and mints new shares to `receiver`. Standard ERC-4626 behavior.
     * 2. **Async, mint-on-claim** ({_depositShareOrigin} returns `address(0)`): decrements
     *    `_totalPendingDepositAssets` and mints new shares to `receiver`. No asset transfer occurs
     *    since assets were already transferred during {requestDeposit}.
     * 3. **Async, pre-minted** ({_depositShareOrigin} returns non-zero): transfers pre-minted shares
     *    from the share origin address to `receiver`.
     *
     * Emits {IERC4626-Deposit}. Per ERC-7540, the first event parameter is the `controller` in async
     * mode and `msg.sender` in sync mode.
     */
    function _deposit(address callerOrController, address receiver, uint256 assets, uint256 shares) internal virtual {
        // If asset() is ERC-777, `transferFrom` can trigger a reentrancy BEFORE the transfer happens through the
        // `tokensToSend` hook. On the other hand, the `tokenReceived` hook, that is triggered after the transfer,
        // calls the vault, which is assumed not malicious.
        //
        // Conclusion: we need to do the transfer before we mint so that any reentrancy would happen before the
        // assets are transferred and before the shares are minted, which is a valid state.
        if (!_isDepositAsync()) {
            // slither-disable-next-line reentrancy-no-eth
            _transferIn(callerOrController, assets);
            _mint(receiver, shares);
        } else if (_depositShareOrigin() == address(0)) {
            _totalPendingDepositAssets -= assets;
            _mint(receiver, shares);
        } else {
            _transfer(_depositShareOrigin(), receiver, shares);
        }

        emit Deposit(callerOrController, receiver, assets, shares);
    }

    /**
     * @dev Internal handler for redeem Requests. Assumes control of `shares` from `owner` and
     * emits {IERC7540Redeem-RedeemRequest}. {requestRedeem} uses the `requestId` returned by
     * {_getRedeemRequestId}.
     *
     * NOTE: Strategies that track Requests separately (e.g. {ERC7540DelayRedeem}, {ERC7540EpochRedeem}) record the
     * Request under `requestId`. Other callers of this function are expected to pass the value returned by
     * {_getRedeemRequestId}, so that the Request is recorded under the current maturity timepoint or epoch.
     *
     * Share custody depends on {_redeemShareDestination}:
     *
     * * `address(0)` (default): shares are burned immediately and `_totalPendingRedeemShares` is
     *   incremented to keep {_totalOutstandingShares} accurate.
     * * Non-zero address: shares are transferred to that address and held until fulfillment.
     *
     * Authorization for a `msg.sender` not equal to `owner` is checked via operator status first;
     * if that fails, ERC-20 allowance is spent via {ERC20-_spendAllowance}. This dual-authorization
     * approach is consistent with ERC-6909 semantics.
     *
     * Requirements:
     *
     * * {_isRedeemAsync} must return `true`, otherwise reverts with {ERC7540SyncRedeem}.
     */
    function _requestRedeem(uint256 shares, address controller, address owner, uint256 requestId) internal virtual {
        require(_isRedeemAsync(), ERC7540SyncRedeem());

        address sender = _msgSender();
        if (owner != sender && !isOperator(owner, sender)) {
            _spendAllowance(owner, sender, shares);
        }
        if (_redeemShareDestination() == address(0)) {
            _totalPendingRedeemShares += shares;
            _burn(owner, shares);
        } else {
            _transfer(owner, _redeemShareDestination(), shares);
        }

        emit RedeemRequest(controller, owner, requestId, _msgSender(), shares);
    }

    /**
     * @dev Burns shares from {_redeemShareDestination} as part of redeem fulfillment when using
     * the escrow share custody model. Increments {totalPendingRedeemShares} by `shares`.
     *
     * IMPORTANT: This function requires {_redeemShareDestination} to return a non-zero address.
     * When {_redeemShareDestination} returns `address(0)`, shares were already burned at request
     * time inside {_requestRedeem} and this function must not be called.
     */
    function _burnSharesOnRedeemFulfill(uint256 /*assets*/, uint256 shares) internal virtual {
        require(_redeemShareDestination() != address(0), ERC7540UnauthorizedBurnSharesOnRedeemFulfill());
        _totalPendingRedeemShares += shares;
        _burn(_redeemShareDestination(), shares);
    }

    /**
     * @dev Common workflow for withdraw and redeem claim operations.
     *
     * Handles two cases depending on the vault configuration:
     *
     * 1. **Synchronous** ({_isRedeemAsync} returns `false`): spends ERC-20 allowance if `caller` is not
     *    `owner`, burns shares from `owner`, and transfers underlying assets to `receiver`.
     * 2. **Async**: decrements `_totalPendingRedeemShares` (shares were already burned/escrowed during
     *    the Request or fulfillment phase) and transfers underlying assets to `receiver`.
     *
     * Emits {IERC4626-Withdraw}.
     */
    function _withdraw(
        address caller,
        address receiver,
        address owner,
        uint256 assets,
        uint256 shares
    ) internal virtual {
        if (!_isRedeemAsync() && caller != owner) {
            _spendAllowance(owner, caller, shares);
        }

        // If asset() is ERC-777, `transfer` can trigger a reentrancy AFTER the transfer happens through the
        // `tokensReceived` hook. On the other hand, the `tokensToSend` hook, that is triggered before the transfer,
        // calls the vault, which is assumed not malicious.
        //
        // Conclusion: we need to do the transfer after the burn so that any reentrancy would happen after the
        // shares are burned and after the assets are transferred, which is a valid state.
        if (!_isRedeemAsync()) {
            _burn(owner, shares);
        } else {
            _totalPendingRedeemShares -= shares;
        }
        _transferOut(receiver, assets);

        emit Withdraw(caller, receiver, owner, assets, shares);
    }

    /**
     * @dev Performs a transfer-in of underlying assets from `from` to the vault.
     * The default implementation uses {SafeERC20-safeTransferFrom}. Used by {_deposit} (sync) and
     * {_requestDeposit} (async).
     */
    function _transferIn(address from, uint256 assets) internal virtual {
        SafeERC20.safeTransferFrom(IERC20(asset()), from, address(this), assets);
    }

    /**
     * @dev Performs a transfer-out of underlying assets from the vault to `to`.
     * The default implementation uses {SafeERC20-safeTransfer}. Used by {_withdraw}.
     */
    function _transferOut(address to, uint256 assets) internal virtual {
        SafeERC20.safeTransfer(IERC20(asset()), to, assets);
    }

    /**
     * @dev Returns the decimal offset used for virtual shares/assets in {_convertToShares} and
     * {_convertToAssets}. Defaults to 0. Increase to strengthen inflation-attack protection
     * at the cost of share-price granularity.
     *
     * See https://docs.openzeppelin.com/contracts/5.x/erc4626#inflation-attack[ERC-4626 security considerations].
     */
    function _decimalsOffset() internal view virtual returns (uint8) {
        return 0;
    }

    /**
     * @dev Returns the address from which shares are transferred to the receiver on deposit claim.
     *
     * * `address(0)` (default): shares are minted directly to the receiver at claim time. Pending
     *   deposit assets are tracked via {totalPendingDepositAssets} and decremented in {_deposit}.
     * * Non-zero address: shares are pre-minted to this address during fulfillment (via
     *   {_mintSharesOnDepositFulfill}) and transferred to the receiver on claim.
     *
     * NOTE: If overridden to return a non-zero address, that address must not be able to transfer
     * shares (otherwise pre-minted shares could be moved before they are claimed). Use an unowned
     * address such as `address(0xdead)`. Avoid addresses in the precompile reserved range
     * (`address(1)` through `address(0x1ff)`, see EIP-7587).
     *
     * IMPORTANT: The returned address (and whether it is zero) MUST be immutable for the vault's
     * lifetime. Request, fulfillment, and claim stages, as well as the {totalAssets} and {_totalOutstandingShares}
     * views, read this hook independently, so a value that changes between stages settles different
     * stages under different custody rules and corrupts pending-asset / share accounting.
     */
    function _depositShareOrigin() internal view virtual returns (address) {
        return address(0);
    }

    /**
     * @dev Returns the address to which shares are transferred (escrowed) on redeem request.
     *
     * * `address(0)` (default): shares are burned immediately at request time. Pending redeem shares
     *   are tracked via {totalPendingRedeemShares} so that {_totalOutstandingShares} remains accurate.
     * * Non-zero address: shares are transferred to this address on request and burned during
     *   fulfillment (via {_burnSharesOnRedeemFulfill}).
     *
     * NOTE: If overridden to return a non-zero address, that address must not be able to transfer
     * shares (otherwise escrowed shares could be moved before they are burned). Use an unowned
     * address such as `address(0xdead)`. Avoid addresses in the precompile reserved range
     * (`address(1)` through `address(0x1ff)`, see EIP-7587).
     *
     * IMPORTANT: The returned address (and whether it is zero) MUST be immutable for the vault's
     * lifetime. Request, fulfillment, and claim stages read this hook independently, so a value that
     * changes between stages settles different stages under different custody rules and corrupts
     * pending-share / asset accounting.
     */
    function _redeemShareDestination() internal view virtual returns (address) {
        return address(0);
    }

    // ==============================================================
    //              VIRTUAL HOOKS FOR STRATEGY EXTENSIONS
    // ==============================================================

    /**
     * @dev Returns `true` if the deposit flow is asynchronous (Request-based). When `false`, {deposit} and
     * {mint} behave as standard synchronous ERC-4626 operations.
     *
     * Override to return `true` in extensions that provide an async deposit fulfillment strategy.
     */
    function _isDepositAsync() internal pure virtual returns (bool);

    /**
     * @dev Returns `true` if the redeem flow is asynchronous (Request-based). When `false`, {withdraw} and
     * {redeem} behave as standard synchronous ERC-4626 operations.
     *
     * Override to return `true` in extensions that provide an async redeem fulfillment strategy.
     */
    function _isRedeemAsync() internal pure virtual returns (bool);

    /**
     * @dev Returns the `requestId` of a deposit Request submitted now for `controller`. Strategies that aggregate
     * all the deposit Requests of a controller return 0; others track Requests separately (e.g. by epoch or by
     * maturity timepoint). Not `view`, so that strategies can update their state when assigning an id (e.g. a
     * counter incremented on each Request).
     */
    function _getDepositRequestId(address /* controller */) internal virtual returns (uint256);

    /**
     * @dev Returns the `requestId` of a redeem Request submitted now for `controller`. Strategies that aggregate
     * all the redeem Requests of a controller return 0; others track Requests separately (e.g. by epoch or by
     * maturity timepoint). Not `view`, so that strategies can update their state when assigning an id (e.g. a
     * counter incremented on each Request).
     */
    function _getRedeemRequestId(address /* controller */) internal virtual returns (uint256);

    /// @dev Returns the amount of assets in Pending state for `controller` with the given `requestId`.
    function _pendingDepositRequest(
        uint256 /*requestId*/,
        address /*controller*/
    ) internal view virtual returns (uint256);

    /// @dev Returns the amount of assets in Claimable state for `controller` with the given `requestId`.
    function _claimableDepositRequest(
        uint256 /*requestId*/,
        address /*controller*/
    ) internal view virtual returns (uint256);

    /// @dev Returns the amount of shares in Pending state for `controller` with the given `requestId`.
    function _pendingRedeemRequest(
        uint256 /*requestId*/,
        address /*controller*/
    ) internal view virtual returns (uint256);

    /// @dev Returns the amount of shares in Claimable state for `controller` with the given `requestId`.
    function _claimableRedeemRequest(
        uint256 /*requestId*/,
        address /*controller*/
    ) internal view virtual returns (uint256);

    /**
     * @dev Consumes `assets` worth of a Claimable deposit for `controller` and returns the corresponding
     * number of shares. Called by {deposit} (three-argument overload) in async mode.
     *
     * NOTE: In async mode, this function may be susceptible to the inflation attack vector described in
     * https://docs.openzeppelin.com/contracts/5.x/erc4626#inflation-attack[ERC-4626 security considerations]
     * if the shares are freed automatically (e.g. after a certain time period). Consider using {_decimalsOffset}
     * to mitigate this risk.
     */
    function _consumeClaimableDeposit(uint256 /*assets*/, address /*controller*/) internal virtual returns (uint256);

    /**
     * @dev Consumes `shares` worth of a Claimable deposit for `controller` and returns the corresponding
     * number of assets. Called by {mint} (three-argument overload) in async mode.
     */
    function _consumeClaimableMint(uint256 /*shares*/, address /*controller*/) internal virtual returns (uint256);

    /**
     * @dev Consumes `assets` worth of a Claimable redeem for `controller` and returns the corresponding
     * number of shares. Called by {withdraw} in async mode.
     */
    function _consumeClaimableWithdraw(uint256 /*assets*/, address /*controller*/) internal virtual returns (uint256);

    /**
     * @dev Consumes `shares` worth of a Claimable redeem for `controller` and returns the corresponding
     * number of assets. Called by {redeem} in async mode.
     */
    function _consumeClaimableRedeem(uint256 /*shares*/, address /*controller*/) internal virtual returns (uint256);

    /// @dev Returns the maximum assets that can be claimed via {deposit} for an async `owner`.
    function _asyncMaxDeposit(address /*owner*/) internal view virtual returns (uint256);

    /// @dev Returns the maximum shares that can be claimed via {mint} for an async `owner`.
    function _asyncMaxMint(address /*owner*/) internal view virtual returns (uint256);

    /// @dev Returns the maximum assets that can be claimed via {withdraw} for an async `owner`.
    function _asyncMaxWithdraw(address /*owner*/) internal view virtual returns (uint256);

    /// @dev Returns the maximum shares that can be claimed via {redeem} for an async `owner`.
    function _asyncMaxRedeem(address /*owner*/) internal view virtual returns (uint256);

    /**
     * @dev Returns the assets of Claimable deposit Requests that are still counted in
     * {totalPendingDepositAssets}, i.e. assets fulfilled at a locked rate whose shares are minted at
     * claim time. They are added back to {totalAssets} so that the vault's exchange rate treats these
     * Requests as settled.
     *
     * Returning 0 is correct for synchronous deposits, for strategies that do not lock a rate at fulfillment
     * (e.g. the rate is computed at claim time), and for the pre-mint custody model (see {_depositShareOrigin}),
     * where fulfillment already removes the assets from {totalPendingDepositAssets}. Strategies that lock
     * a rate at fulfillment with mint-on-claim custody must report them, together with
     * {_totalClaimableDepositShares}.
     */
    function _totalClaimableDepositAssets() internal view virtual returns (uint256);

    /**
     * @dev Returns the shares owed to Claimable deposit Requests that have not been minted yet. They are
     * added to {_totalOutstandingShares} so that the vault's exchange rate treats these Requests as settled.
     *
     * See {_totalClaimableDepositAssets}.
     */
    function _totalClaimableDepositShares() internal view virtual returns (uint256);

    /**
     * @dev Returns the assets owed to Claimable redeem Requests, still held by the vault until claimed.
     * They are subtracted from {totalAssets} so that the vault's exchange rate treats these Requests as
     * settled.
     *
     * Returning 0 is correct for synchronous redemptions and for strategies that do not lock a rate at
     * fulfillment (e.g. the rate is computed at claim time). Strategies that lock a rate at fulfillment
     * must report them, together with {_totalClaimableRedeemShares}.
     */
    function _totalClaimableRedeemAssets() internal view virtual returns (uint256);

    /**
     * @dev Returns the shares of Claimable redeem Requests, still counted in {totalPendingRedeemShares}
     * until claimed. They are subtracted from {_totalOutstandingShares} so that the vault's exchange
     * rate treats these Requests as settled.
     *
     * See {_totalClaimableRedeemAssets}.
     */
    function _totalClaimableRedeemShares() internal view virtual returns (uint256);
}
