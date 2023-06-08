// SPDX-License-Identifier: MIT

pragma solidity ^0.8.19;

import "../../governance/extensions/GovernorCountingSimple.sol";
import "../../governance/extensions/GovernorVotes.sol";

abstract contract GovernorVoteMocks is GovernorVotes, GovernorCountingSimple {
    function quorum(uint256) public pure override returns (uint256) {
        return 0;
    }

    function votingDelay() public pure override returns (uint256) {
        return 4;
    }

    function votingPeriod() public pure override returns (uint256) {
        return 16;
    }
}
