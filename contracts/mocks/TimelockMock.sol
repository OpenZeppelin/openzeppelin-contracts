// SPDX-License-Identifier: MIT

pragma solidity ^0.6.0;

import "../utils/Timelock.sol";

contract TimelockMock is Timelock {
    constructor(uint256 lockDuration) public Timelock(lockDuration) { }

    function schedule(bytes32 id, uint256 delay) external {
        _schedule(id, delay);
    }

    function execute(bytes32 id, bytes32 predecessor) external {
        _execute(id, predecessor);
    }

    function cancel(bytes32 id) external {
        _cancel(id);
    }

    function updateDelay(uint256 newDelay) external {
        _updateDelay(newDelay);
    }
}
