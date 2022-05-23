// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../token/ERC20/extensions/ERC20TokenizedVault.sol";

// mock class using ERC20
contract ERC20TokenizedVaultMock is ERC20TokenizedVault {
    constructor(
        IERC20Metadata asset,
        string memory name,
        string memory symbol
    ) ERC20(name, symbol) ERC20TokenizedVault(asset) {}

    function mockMint(address account, uint256 amount) public {
        _mint(account, amount);
    }

    function mockBurn(address account, uint256 amount) public {
        _burn(account, amount);
    }
}
