// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {IERC20} from "../../token/ERC20/IERC20.sol";
import {IERC4626} from "../../interfaces/IERC4626.sol";
import {ERC7540} from "../../token/ERC20/extensions/ERC7540.sol";
import {ERC4626} from "../../token/ERC20/extensions/ERC4626.sol";

abstract contract ERC7540LimitsMock is ERC7540 {
    uint256 private immutable _maxDeposit;
    uint256 private immutable _maxMint;

    constructor(IERC20 asset, uint256 maxDepositValue, uint256 maxMintValue) ERC7540(asset) {
        _maxDeposit = maxDepositValue;
        _maxMint = maxMintValue;
    }

    function maxDeposit(address) public view override(ERC7540) returns (uint256) {
        return _maxDeposit;
    }

    function maxMint(address) public view override(ERC4626, IERC4626) returns (uint256) {
        return _maxMint;
    }
}
