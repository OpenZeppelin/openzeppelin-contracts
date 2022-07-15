// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../token/ERC20/extensions/ERC4626.sol";

// mock class using ERC20
contract ERC4626Mock is ERC4626 {
    uint8 private immutable _decimals;

    constructor(
        IERC20Metadata asset,
        string memory name,
        string memory symbol,
        uint8 decimaloverride
    ) ERC20(name, symbol) ERC4626(asset) {
        _decimals = decimaloverride;
    }

    function decimals() public view virtual override returns (uint8) {
        return _decimals;
    }

    function mockMint(address account, uint256 amount) public {
        _mint(account, amount);
    }

    function mockBurn(address account, uint256 amount) public {
        _burn(account, amount);
    }
}
