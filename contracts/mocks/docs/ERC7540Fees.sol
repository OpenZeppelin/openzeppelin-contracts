// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {IERC4626} from "../../interfaces/IERC4626.sol";
import {IERC7540} from "../../interfaces/IERC7540.sol";
import {IERC20} from "../../token/ERC20/IERC20.sol";
import {ERC7540} from "../../token/ERC20/extensions/ERC7540.sol";
import {ERC4626} from "../../token/ERC20/extensions/ERC4626.sol";
import {SafeERC20} from "../../token/ERC20/utils/SafeERC20.sol";
import {Math} from "../../utils/math/Math.sol";

/**
 * @dev ERC-7540 vault with entry/exit fees expressed in basis points.
 *
 * NOTE: This contract charges fees in terms of assets, not shares. The fees are calculated
 * based on the amount of assets being deposited or withdrawn, not the shares being minted or redeemed.
 * This is an opinionated design decision that should be taken into account when integrating.
 *
 * WARNING: This contract is for demonstration purposes and has not been audited. Use it with caution.
 */
abstract contract ERC7540Fees is ERC7540 {
    using SafeERC20 for IERC20;
    using Math for uint256;

    uint256 private constant _BASIS_POINT_SCALE = 1e4;

//    function previewDeposit(uint256 assets) public view virtual override(ERC7540) returns (uint256) {
//        uint256 fee = _feeOnTotal(assets, _entryFeeBasisPoints());
//        return super.previewDeposit(assets - fee);
//    }

//    function previewRedeem(uint256 shares) public view virtual override(ERC7540) returns (uint256) {
//        uint256 assets = super.previewRedeem(shares);
//        uint256 fee = _feeOnTotal(assets, _exitFeeBasisPoints());
//        return assets - fee;
//    }

    function _deposit(address caller, address receiver, uint256 assets, uint256 shares) internal virtual override {
        uint256 fee = _feeOnTotal(assets, _entryFeeBasisPoints());
        address recipient = _entryFeeRecipient();

        super._deposit(caller, receiver, assets - fee, shares);

        if (fee > 0 && recipient != address(this)) {
            IERC20(asset()).safeTransfer(recipient, fee);
        }
    }

    function _withdraw(
        address caller,
        address receiver,
        address owner,
        uint256 assets,
        uint256 shares
    ) internal virtual override {
        uint256 fee = _feeOnRaw(assets, _exitFeeBasisPoints());
        address recipient = _exitFeeRecipient();

        super._withdraw(caller, receiver, owner, assets - fee, shares);

        if (fee > 0 && recipient != address(this)) {
            IERC20(asset()).safeTransfer(recipient, fee);
        }
    }

    function _entryFeeBasisPoints() internal view virtual returns (uint256) {
        return 0; // replace with e.g. 100 for 1%
    }

    function _exitFeeBasisPoints() internal view virtual returns (uint256) {
        return 0; // replace with e.g. 100 for 1%
    }

    function _entryFeeRecipient() internal view virtual returns (address) {
        return address(0); // replace with e.g. a treasury address
    }

    function _exitFeeRecipient() internal view virtual returns (address) {
        return address(0); // replace with e.g. a treasury address
    }

    function _feeOnRaw(uint256 assets, uint256 feeBasisPoints) private pure returns (uint256) {
        return assets.mulDiv(feeBasisPoints, _BASIS_POINT_SCALE, Math.Rounding.Ceil);
    }

    function _feeOnTotal(uint256 assets, uint256 feeBasisPoints) private pure returns (uint256) {
        return assets.mulDiv(feeBasisPoints, feeBasisPoints + _BASIS_POINT_SCALE, Math.Rounding.Ceil);
    }
}
