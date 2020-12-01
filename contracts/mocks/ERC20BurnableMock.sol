// SPDX-License-Identifier: MIT

pragma solidity >=0.6.0 <0.8.0;

import "../token/ERC20/ERC20Burnable.sol";

contract ERC20BurnableMock is ERC20Burnable {
    constructor (
        string memory name,
        string memory symbol,
        address initialAccount,
        uint256 initialBalance
    ) public ERC20(name, symbol) {
        _mint(initialAccount, initialBalance);
    }
}
