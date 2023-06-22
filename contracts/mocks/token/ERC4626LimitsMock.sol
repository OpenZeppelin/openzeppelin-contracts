// SPDX-License-Identifier: MIT

pragma solidity ^0.8.19;

import "../../token/ERC20/extensions/ERC4626.sol";

abstract contract ERC4626LimitsMock is ERC4626 {
    uint256 _maxDeposit;
    uint256 _maxMint;

    constructor() {
        _maxDeposit = 100 ether;
        _maxMint = 100 ether;
    }

    function maxDeposit(address) public view override returns (uint256) {
        return _maxDeposit;
    }

    function maxMint(address) public view override returns (uint256) {
        return _maxMint;
    }
}
