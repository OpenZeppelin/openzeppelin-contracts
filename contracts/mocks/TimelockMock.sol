// SPDX-License-Identifier: MIT

pragma solidity ^0.6.0;

import "../access/Timelock.sol";

contract TimelockMock is Timelock {
    constructor(uint256 lockDuration) public Timelock(lockDuration) { }
}
