// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {IERC20, ERC20} from "../../token/ERC20/ERC20.sol";
import {ERC1363} from "../../token/ERC20/extensions/ERC1363.sol";

abstract contract ERC1363ReturnFalseOnERC20Mock is ERC1363 {
    function transfer(address, uint256) public pure override(IERC20, ERC20) returns (bool) {
        return false;
    }

    function transferFrom(address, address, uint256) public pure override(IERC20, ERC20) returns (bool) {
        return false;
    }

    function approve(address, uint256) public pure override(IERC20, ERC20) returns (bool) {
        return false;
    }
}

abstract contract ERC1363ReturnFalseMock is ERC1363 {
    function transferAndCall(address, uint256, bytes memory) public pure override returns (bool) {
        return false;
    }

    function transferFromAndCall(address, address, uint256, bytes memory) public pure override returns (bool) {
        return false;
    }

    function approveAndCall(address, uint256, bytes memory) public pure override returns (bool) {
        return false;
    }
}
