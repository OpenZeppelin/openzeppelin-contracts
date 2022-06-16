// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../token/ERC1363/ERC1363.sol";

contract ERC1363Mock is ERC1363 {
    constructor(
        string memory name,
        string memory symbol,
        address initialAccount,
        uint256 initialBalance
    ) ERC20(name, symbol) {
        _mint(initialAccount, initialBalance);
    }
}
