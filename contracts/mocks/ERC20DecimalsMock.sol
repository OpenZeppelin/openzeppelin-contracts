// SPDX-License-Identifier: MIT

pragma solidity >=0.6.0 <0.8.0;

import "../token/ERC20/ERC20.sol";

contract ERC20DecimalsMock is ERC20 {
    constructor (string memory name, string memory symbol, uint8 decimals) public ERC20(name, symbol) {
        _setupDecimals(decimals);
    }
}
