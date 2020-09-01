// SPDX-License-Identifier: MIT

pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "../access/TimelockController.sol";

contract TimelockControllerMock is TimelockController {
    constructor(uint256 lockDuration) public TimelockController(lockDuration) { }
}
