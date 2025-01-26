// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {IERC20} from "../../token/ERC20/IERC20.sol";
import {ERC7540} from "../../token/ERC20/extensions/ERC7540.sol";

abstract contract ERC7540OffsetMock is ERC7540 {
    uint8 private immutable _offset;

    constructor(IERC20 asset, uint8 offset) ERC7540(asset) {
        _offset = offset;
    }

    function _decimalsOffset() internal view override returns (uint8) {
        return _offset;
    }
}
