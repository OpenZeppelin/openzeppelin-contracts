// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../security/FlashLoanGuard.sol";

contract FlashLoanMock is FlashLoanGuard {
    uint256 public counter;

    constructor() {
        counter = 0;
    }

    function increaseSafe() public flashLoanGuard {
        counter += 1;
    }

    function increaseUnsafe() public {
        counter += 1;
    }
}
