// SPDX-License-Identifier: MIT

pragma solidity >0.8.999 <0.10.0;

contract ERC20ExcessDecimalsMock {
    function decimals() public pure returns (uint256) {
        return type(uint256).max;
    }
}
