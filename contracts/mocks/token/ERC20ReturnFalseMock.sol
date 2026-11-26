// SPDX-License-Identifier: MIT

pragma solidity >0.8.999 <0.10.0;

import {ERC20} from "../../token/ERC20/ERC20.sol";

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
