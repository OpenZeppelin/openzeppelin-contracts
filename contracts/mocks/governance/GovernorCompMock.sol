// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../../governance/extensions/GovernorCountingSimple.sol";
import "../../governance/extensions/GovernorVotesComp.sol";

abstract contract GovernorCompMock is GovernorVotesComp, GovernorCountingSimple {
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
