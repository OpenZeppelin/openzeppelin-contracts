// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {ERC4626} from "../../token/ERC20/extensions/ERC4626.sol";

abstract contract ERC4626OffsetMock is ERC4626 {
    uint8 private immutable _offset;

    constructor(uint8 offset_) {
        _offset = offset_;
    }

    function _decimalsOffset() internal view virtual override returns (uint8) {
        return _offset;
    }
}
