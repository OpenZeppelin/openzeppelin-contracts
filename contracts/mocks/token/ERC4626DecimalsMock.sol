// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../../token/ERC20/extensions/ERC4626.sol";

abstract contract ERC4626DecimalsMock is ERC4626 {
    using Math for uint256;

    uint8 private immutable _decimals;

    constructor(uint8 decimals_) {
        _decimals = decimals_;
    }

    function decimals() public view virtual override returns (uint8) {
        return _decimals;
    }

    function _initialConvertToShares(
        uint256 assets,
        Math.Rounding rounding
    ) internal view virtual override returns (uint256 shares) {
        return assets.mulDiv(10 ** decimals(), 10 ** super.decimals(), rounding);
    }

    function _initialConvertToAssets(
        uint256 shares,
        Math.Rounding rounding
    ) internal view virtual override returns (uint256 assets) {
        return shares.mulDiv(10 ** super.decimals(), 10 ** decimals(), rounding);
    }
}
