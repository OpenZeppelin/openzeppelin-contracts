// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../../token/ERC20/ERC20.sol";

abstract contract ERC20Decimals is ERC20 {
    uint8 private immutable _decimals;

    constructor(uint8 decimals_) {
        _decimals = decimals_;
    }

    function decimals() public view virtual override returns (uint8) {
        return _decimals;
    }
}
