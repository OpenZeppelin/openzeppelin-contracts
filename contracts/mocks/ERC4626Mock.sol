// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../token/ERC20/extensions/ERC4626.sol";

contract ERC4626Mock is ERC4626 {
    constructor(
        IERC20Metadata asset,
        string memory name,
        string memory symbol
    ) ERC20(name, symbol) ERC4626(asset) {}

    function mockMint(address account, uint256 amount) public {
        _mint(account, amount);
    }

    function mockBurn(address account, uint256 amount) public {
        _burn(account, amount);
    }
}

contract ERC4626DecimalMock is ERC4626Mock {
    uint8 private immutable _decimals;

    constructor(
        IERC20Metadata asset,
        string memory name,
        string memory symbol,
        uint8 decimalsOverride
    ) ERC4626Mock(asset, name, symbol) {
        _decimals = decimalsOverride;
    }

    function decimals() public view virtual override returns (uint8) {
        return _decimals;
    }
}
