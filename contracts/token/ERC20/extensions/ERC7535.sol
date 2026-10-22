// SPDX-License-Identifier: MIT

pragma solidity ^0.8.31;

import {IERC4626} from "../../../interfaces/IERC4626.sol";
import {Address} from "../../../utils/Address.sol";
import {IERC20} from "../IERC20.sol";
import {ERC4626} from "./ERC4626.sol";

/**
 * @dev Implementation of the ERC-7535 "Native Asset ERC-4626 Tokenized Vault" as defined in
 * https://eips.ethereum.org/EIPS/eip-7535[ERC-7535].
 *
 * ERC-7535 is an adaptation of {ERC4626} that uses the chain's native asset (e.g. Ether) as the underlying
 * asset instead of an ERC-20 token. It is implemented as a thin extension of {ERC4626}: the share accounting,
 * rounding directions, virtual-offset inflation mitigation, preview functions, and checks-effects-interactions
 * ordering are all inherited unchanged.
 *
 * Relative to {ERC4626}:
 *
 * * {asset} returns the ERC-7528 native-asset placeholder `0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE`.
 * * {totalAssets} returns the contract's own native-asset balance (`address(this).balance`), excluding the
 * `msg.value` of the current call. Shares are therefore priced against the pre-deposit balance, as in {ERC4626}.
 * * {deposit} and {mint} are `payable` (as declared by `IERC4626`): the native asset is provided as `msg.value`
 * rather than pulled with an ERC-20 `transferFrom`, so there is no allowance flow for the underlying. {deposit}
 * prices shares off `msg.value` and ignores its `assets` argument (per ERC-7535); {mint} requires `msg.value` to
 * cover the previewed cost. {ERC4626-_enablePayableDeposit} is overridden to accept the native value.
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
 * payments), even though plain transfers to the vault fail (the contract has no `receive` or `fallback`
 * function). Because {totalAssets} is balance-based it tracks such donations exactly as a direct ERC-20 transfer
 * would for {ERC4626}; the virtual-offset math is the defense.
 * ====
 *
 * NOTE: `deposit(assets, receiver)` deposits the entire `msg.value` and mints `previewDeposit(msg.value)` shares,
 * ignoring the `assets` argument (per ERC-7535). `mint(shares, receiver)` requires `msg.value` to be at least the
 * previewed cost; any excess `msg.value` on a `mint` is refunded to the caller.
 *
 * WARNING: {deposit} and {mint} rely on `msg.value`, which is preserved across a `delegatecall`. A `payable`
 * batching mechanism that `delegatecall`s into the vault itself would let the same `msg.value` be counted by every
 * {deposit} or {mint} in the batch, minting shares several times for a single payment. {Multicall} is safe in
 * this regard because {Multicall-multicall} is not `payable` (`msg.value` is always zero in its subcalls), but it
 * MUST NOT be replaced by a `payable` variant.
 *
 * To learn more, check out our xref:ROOT:erc7535.adoc[ERC-7535 guide].
 */
abstract contract ERC7535 is ERC4626 {
    /// @dev Attempted to {mint} with a `msg.value` below the previewed cost of the shares.
    error ERC7535InsufficientNativeValue(uint256 value, uint256 expected);

    /// @dev Configures the vault with the ERC-7528 native-asset placeholder, exposed through {asset}. The placeholder
    /// address has no `decimals()`, so the inherited {ERC4626} decimals detection falls back to 18, the native asset's
    /// decimals.
    // The address is inlined (rather than a private constant) because the upgradeable transpiler copies this
    // argument verbatim into the initializer of every inheriting contract, where a private constant is not in scope.
    constructor() ERC4626(IERC20(0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE)) {}

    /**
     * @inheritdoc IERC4626
     *
     * @dev Excludes the `msg.value` of the current call, so that {deposit} and {mint} price shares against the
     * pre-deposit balance (and a standalone {previewDeposit} matches the subsequent {deposit}). Outside a `payable`
     * call, `msg.value` is `0` and this is the full balance.
     *
     * WARNING: When extending this contract, consider that native asset sent out during a `payable` call, such as
     * the refund of an overpaid {mint}, is still subtracted through `msg.value`. For the rest of that call,
     * {totalAssets} returns a value lowered by the amount sent, and reverts if that amount exceeds the pre-deposit
     * balance.
     */
    function totalAssets() public view virtual override returns (uint256) {
        return address(this).balance - _msgValue();
    }

    /**
     * @inheritdoc IERC4626
     *
     * @dev Per ERC-7535, the deposited amount is the entire `msg.value`: shares are priced off `msg.value` and the
     * `assets` argument is ignored, so the full native value sent is always converted to shares (none is silently
     * retained as a donation). Reverts via {maxDeposit} if `msg.value` exceeds the maximum.
     */
    function deposit(uint256, address receiver) public payable virtual override returns (uint256) {
        return super.deposit(msg.value, receiver);
    }

    /**
     * @inheritdoc IERC4626
     *
     * @dev Reverts with {ERC7535InsufficientNativeValue} if `msg.value` is below the returned `assets`, and refunds
     * any excess to the caller through {_refund}. The refund runs after {_deposit} returns, so a {_deposit} override
     * sees the pre-deposit {totalAssets}, and a reentrant call during the refund sees a {totalAssets} and
     * {totalSupply} that both account for this deposit.
     */
    function mint(uint256 shares, address receiver) public payable virtual override returns (uint256) {
        uint256 assets = super.mint(shares, receiver);
        if (msg.value < assets) {
            revert ERC7535InsufficientNativeValue(msg.value, assets);
        } else if (msg.value > assets) {
            _refund(_msgSender(), msg.value - assets);
        }
        return assets;
    }

    /// @dev See {ERC4626-_enablePayableDeposit}. Native value is processed by the {deposit} and {mint} overrides.
    function _enablePayableDeposit() internal view virtual override returns (bool) {
        return true;
    }

    /// @dev No-op: the native asset has already been received as `msg.value`. See {ERC4626-_transferIn}.
    function _transferIn(address /* from */, uint256 /* assets */) internal virtual override {}

    /// @dev Sends the native asset out with `Address.sendValue`, which forwards all remaining gas. See
    /// {ERC4626-_transferOut}.
    function _transferOut(address to, uint256 assets) internal virtual override {
        Address.sendValue(payable(to), assets);
    }

    /// @dev Sends back native value that was received but never became vault assets, such as the excess
    /// `msg.value` of a {mint}. Kept separate from {_transferOut} so that custom payout logic (e.g. unstaking
    /// assets before sending them) does not apply to refunds. Uses `Address.sendValue`, which forwards all
    /// remaining gas.
    function _refund(address to, uint256 value) internal virtual {
        Address.sendValue(payable(to), value);
    }

    // `msg.value` cannot be read directly in a non-payable public function such as {totalAssets}.
    function _msgValue() private view returns (uint256) {
        return msg.value;
    }
}
