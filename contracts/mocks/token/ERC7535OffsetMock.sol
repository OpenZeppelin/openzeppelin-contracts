// SPDX-License-Identifier: MIT

pragma solidity ^0.8.24;

import {ERC7535} from "../../token/ERC20/extensions/ERC7535.sol";

abstract contract ERC7535OffsetMock is ERC7535 {
    uint8 private immutable _offset;

    constructor(uint8 offset_) {
        _offset = offset_;
    }

    function _decimalsOffset() internal view virtual override returns (uint8) {
        return _offset;
    }
}
