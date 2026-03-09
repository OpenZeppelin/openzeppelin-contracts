// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {ERC4626} from "../../token/ERC20/extensions/ERC4626.sol";
import {ERC20Vault, IERC20Vault} from "../../token/ERC20/extensions/ERC20Vault.sol";

abstract contract ERC4626LimitsMock is ERC4626 {
    uint256 _maxDeposit;
    uint256 _maxMint;

    constructor() {
        _maxDeposit = 100 ether;
        _maxMint = 100 ether;
    }

    function maxDeposit(address) public view override(ERC20Vault, IERC20Vault) returns (uint256) {
        return _maxDeposit;
    }

    function maxMint(address) public view override(ERC20Vault, IERC20Vault) returns (uint256) {
        return _maxMint;
    }
}
