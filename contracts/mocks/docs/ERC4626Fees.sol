// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../../token/ERC20/extensions/ERC4626.sol";

abstract contract ERC4626Fees is ERC4626 {
    using Math for uint256;

    /** @dev See {IERC4626-previewDeposit}. */
    function previewDeposit(uint256 assets) public view virtual override returns (uint256) {
        uint256 fee = _feeOnTotal(assets, _entryFeeBasePoint());
        return super.previewDeposit(assets - fee);
    }

    /** @dev See {IERC4626-previewMint}. */
    function previewMint(uint256 shares) public view virtual override returns (uint256) {
        uint256 assets = super.previewMint(shares);
        return assets + _feeOnRaw(assets, _entryFeeBasePoint());
    }

    /** @dev See {IERC4626-previewWithdraw}. */
    function previewWithdraw(uint256 assets) public view virtual override returns (uint256) {
        uint256 fee = _feeOnRaw(assets, _exitFeeBasePoint());
        return super.previewWithdraw(assets + fee);
    }

    /** @dev See {IERC4626-previewRedeem}. */
    function previewRedeem(uint256 shares) public view virtual override returns (uint256) {
        uint256 assets = super.previewRedeem(shares);
        return assets - _feeOnTotal(assets, _exitFeeBasePoint());
    }

    /** @dev See {IERC4626-_deposit}. */
    function _deposit(address caller, address receiver, uint256 assets, uint256 shares) internal virtual override {
        uint256 fee = _feeOnTotal(assets, _entryFeeBasePoint());
        address recipient = _entryFeeRecipient();

        super._deposit(caller, receiver, assets, shares);

        if (fee > 0 && recipient != address(this)) {
            SafeERC20.safeTransfer(IERC20(asset()), recipient, fee);
        }
    }

    /** @dev See {IERC4626-_deposit}. */
    function _withdraw(
        address caller,
        address receiver,
        address owner,
        uint256 assets,
        uint256 shares
    ) internal virtual override {
        uint256 fee = _feeOnRaw(assets, _exitFeeBasePoint());
        address recipient = _exitFeeRecipient();

        super._withdraw(caller, receiver, owner, assets, shares);

        if (fee > 0 && recipient != address(this)) {
            SafeERC20.safeTransfer(IERC20(asset()), recipient, fee);
        }
    }

    function _entryFeeBasePoint() internal view virtual returns (uint256) {
        return 0;
    }

    function _entryFeeRecipient() internal view virtual returns (address) {
        return address(0);
    }

    function _exitFeeBasePoint() internal view virtual returns (uint256) {
        return 0;
    }

    function _exitFeeRecipient() internal view virtual returns (address) {
        return address(0);
    }

    function _feeOnRaw(uint256 assets, uint256 feeBasePoint) private pure returns (uint256) {
        return assets.mulDiv(feeBasePoint, 1e5, Math.Rounding.Up);
    }

    function _feeOnTotal(uint256 assets, uint256 feeBasePoint) private pure returns (uint256) {
        return assets.mulDiv(feeBasePoint, feeBasePoint + 1e5, Math.Rounding.Up);
    }
}
