// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../../token/ERC777/ERC777.sol";

abstract contract ERC777Mock is ERC777 {
    event BeforeTokenTransfer();

    function _beforeTokenTransfer(address, address, address, uint256) internal override {
        emit BeforeTokenTransfer();
    }
}
