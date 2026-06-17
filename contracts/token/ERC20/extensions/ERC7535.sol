// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v5.7.0) (token/ERC20/extensions/ERC7535.sol)

pragma solidity ^0.8.24;

import {IERC20} from "../IERC20.sol";
import {IERC4626} from "../../../interfaces/IERC4626.sol";
import {ERC4626} from "./ERC4626.sol";
import {Address} from "../../../utils/Address.sol";
import {Math} from "../../../utils/math/Math.sol";

/**
 * @dev Implementation of the ERC-7535 "Native Asset ERC-4626 Tokenized Vault" as defined in
 * https://eips.ethereum.org/EIPS/eip-7535[ERC-7535].
 *
 * ERC-7535 is an adaptation of {ERC4626} that uses the chain's native asset (e.g. Ether) as the underlying
 * asset instead of an ERC-20 token. It is implemented as a thin extension of {ERC4626}: the share accounting,
 * rounding directions, virtual-offset inflation mitigation, preview functions, and checks-effects-interactions
 * ordering are all inherited unchanged. Only the asset-movement seams differ.
 *
 * Relative to {ERC4626}:
 *
 * * {asset} returns the ERC-7528 native-asset placeholder `0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE`.
 * * {totalAssets} returns the contract's own native-asset balance (`address(this).balance`).
 * * {deposit} and {mint} are `payable` (as declared by `IERC4626`): the native asset is provided as `msg.value`
 * rather than pulled with an ERC-20 `transferFrom`, so there is no allowance flow for the underlying. The
 * inherited {ERC4626-_checkPayment} hook is overridden to require `msg.value` to cover the deposit.
 * * {ERC4626-_transferIn} is a no-op (the value has already arrived as `msg.value`) and {ERC4626-_transferOut}
 * sends the native asset out with `Address.sendValue`.
 *
 * IMPORTANT: A vault backed by a wrapped native asset (such as WETH9) MUST NOT use this contract; per ERC-7528
 * and ERC-7535 such a vault is a plain {ERC4626} over the wrapper ERC-20 and MUST report that wrapper's address
 * from {asset}, not the native-asset placeholder.
 *
 * [CAUTION]
 * ====
 * Like {ERC4626}, an empty (or nearly empty) vault is exposed to a donation / inflation attack, and the same
 * configurable virtual shares and assets mitigate it. Override `_decimalsOffset()` to harden a deployment; see
 * the {ERC4626} documentation for the underlying math.
 *
 * A native asset vault can additionally be force-fed value (e.g. through `SELFDESTRUCT` or block-reward
 * payments) that bypasses the {receive} guard. Because {totalAssets} is balance-based it tracks such donations
 * exactly as a direct ERC-20 transfer would for {ERC4626}; the virtual-offset math, not the {receive} revert, is
 * the defense.
 * ====
 *
 * NOTE: `deposit(assets, receiver)` and `mint(shares, receiver)` require `msg.value` to be at least the amount
 * (resp. the previewed cost) being deposited. Any excess `msg.value` is kept by the vault as a donation, raising
 * the share price for existing holders.
 *
 * To learn more, check out our xref:ROOT:erc7535.adoc[ERC-7535 guide].
 */
abstract contract ERC7535 is ERC4626 {
    using Math for uint256;

    /// @dev The ERC-7528 placeholder address representing the native asset; exposed through {asset}.
    address private constant NATIVE_ASSET = 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;

    /// @dev Attempted to {deposit} or {mint} with a `msg.value` below the required native amount.
    error ERC7535InsufficientNativeValue(uint256 value, uint256 expected);

    /// @dev Reverts on a plain native-asset transfer to the vault — value enters only via {deposit} or {mint}.
    error ERC7535UnsolicitedDeposit();

    /// @dev Configures the vault for the native asset. The placeholder address has no `decimals()`, so the
    /// inherited {ERC4626} decimals detection falls back to 18, the native asset's decimals.
    constructor() ERC4626(IERC20(NATIVE_ASSET)) {}

    /// @inheritdoc IERC4626
    function asset() public view virtual override returns (address) {
        return NATIVE_ASSET;
    }

    /// @inheritdoc IERC4626
    function totalAssets() public view virtual override returns (uint256) {
        return address(this).balance;
    }

    /// @dev See {ERC4626-_checkPayment}. Requires the native value sent to cover `assets`; any excess is kept by
    /// the vault (raising the share price for existing holders, like a donation).
    function _checkPayment(uint256 assets) internal virtual override {
        if (msg.value < assets) {
            revert ERC7535InsufficientNativeValue(msg.value, assets);
        }
    }

    /// @inheritdoc ERC4626
    function _convertToShares(uint256 assets, Math.Rounding rounding) internal view virtual override returns (uint256) {
        return assets.mulDiv(totalSupply() + 10 ** _decimalsOffset(), _pretotalAssets() + 1, rounding);
    }

    /// @inheritdoc ERC4626
    function _convertToAssets(uint256 shares, Math.Rounding rounding) internal view virtual override returns (uint256) {
        return shares.mulDiv(_pretotalAssets() + 1, totalSupply() + 10 ** _decimalsOffset(), rounding);
    }

    /**
     * @dev Returns the value of {totalAssets} the share math is priced against — the contract's balance excluding
     * any in-flight `msg.value` from the current `payable` call. In any non-`payable` context `msg.value` is `0`
     * and this equals {totalAssets}; inside {deposit}/{mint} it yields the pre-call balance, so a standalone
     * {previewDeposit} returns exactly the shares a subsequent {deposit} mints. Overrides MUST return a value less
     * than or equal to {totalAssets}.
     */
    function _pretotalAssets() internal view virtual returns (uint256) {
        return totalAssets() - msg.value;
    }

    /// @dev No-op: the native asset has already been received as `msg.value`. See {ERC4626-_transferIn}.
    function _transferIn(address /* from */, uint256 /* assets */) internal virtual override {}

    /// @dev Sends the native asset out with `Address.sendValue`, which forwards all remaining gas. See
    /// {ERC4626-_transferOut}.
    function _transferOut(address to, uint256 assets) internal virtual override {
        Address.sendValue(payable(to), assets);
    }

    /// @dev Reverts on plain native-asset transfers; value must enter via {deposit} or {mint}. This does not stop
    /// protocol-level force-feeds (`SELFDESTRUCT`, block-reward payments), which bypass `receive` entirely.
    receive() external payable virtual {
        revert ERC7535UnsolicitedDeposit();
    }
}
