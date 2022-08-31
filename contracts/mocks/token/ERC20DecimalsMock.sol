// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../../token/ERC20/ERC20.sol";

abstract contract ERC20DecimalsMock is ERC20 {
    uint8 private immutable _decimals;

    constructor(uint8 decimals_) {
        _decimals = decimals_;
    }

    function decimals() public view override returns (uint8) {
        return _decimals;
    }
}
