// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./FlashLoanMock.sol";

contract FlashLoanAttack is FlashLoanGuard {
    function increaseSafe(address addr) public {
        FlashLoanMock(addr).increaseSafe();
        FlashLoanMock(addr).increaseSafe();
        FlashLoanMock(addr).increaseSafe();
    }

    function increaseUnsafe(address addr) public {
        FlashLoanMock(addr).increaseUnsafe();
        FlashLoanMock(addr).increaseUnsafe();
        FlashLoanMock(addr).increaseUnsafe();
    }
}
