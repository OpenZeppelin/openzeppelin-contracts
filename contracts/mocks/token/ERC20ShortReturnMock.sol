// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {ERC20} from "../../token/ERC20/ERC20.sol";

abstract contract ERC20ShortReturnMock is ERC20 {
    uint256 internal immutable _zeroCount;

    constructor(uint256 zeroCount) {
        _zeroCount = zeroCount;
    }

    function transfer(address to, uint256 amount) public override returns (bool) {
        super.transfer(to, amount);

        uint256 returndatalength = _zeroCount;
        assembly ("memory-safe") {
            for {
                let i := 0
            } lt(i, returndatalength) {
                i := add(i, 32)
            } {
                mstore(i, 0)
            }
            return(0, returndatalength)
        }
    }

    function transferFrom(address from, address to, uint256 amount) public override returns (bool) {
        super.transferFrom(from, to, amount);

        uint256 returndatalength = _zeroCount;
        assembly ("memory-safe") {
            for {
                let i := 0
            } lt(i, returndatalength) {
                i := add(i, 32)
            } {
                mstore(i, 0)
            }
            return(0, returndatalength)
        }
    }

    function approve(address spender, uint256 allowance) public override returns (bool) {
        super.approve(spender, allowance);

        uint256 returndatalength = _zeroCount;
        assembly ("memory-safe") {
            for {
                let i := 0
            } lt(i, returndatalength) {
                i := add(i, 32)
            } {
                mstore(i, 0)
            }
            return(0, returndatalength)
        }
    }
}
