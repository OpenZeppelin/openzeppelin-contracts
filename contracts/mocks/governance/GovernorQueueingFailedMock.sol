// SPDX-License-Identifier: MIT

pragma solidity ^0.8.24;

import {GovernorMock} from "./GovernorMock.sol";

/// @dev Mock that signals queueing is required but inherits the base `_queueOperations` that returns 0,
/// triggering `GovernorProposalQueueingFailed` from `Governor.queue`.
abstract contract GovernorQueueingFailedMock is GovernorMock {
    function proposalNeedsQueuing(uint256) public pure override returns (bool) {
        return true;
    }
}
