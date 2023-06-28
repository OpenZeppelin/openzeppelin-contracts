// SPDX-License-Identifier: MIT

pragma solidity ^0.8.19;

import "../../token/ERC20/ERC20.sol";

abstract contract ERC20ReturnFalseMock is ERC20 {
    function transfer(address, uint256) public pure override returns (bool) {
        return false;
    }

    function transferFrom(address, address, uint256) public pure override returns (bool) {
        return false;
    }

    function approve(address, uint256) public pure override returns (bool) {
        return false;
    }
}
