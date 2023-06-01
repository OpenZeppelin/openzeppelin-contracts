// SPDX-License-Identifier: MIT

pragma solidity ^0.8.19;

import "../../governance/extensions/GovernorSettings.sol";
import "../../governance/extensions/GovernorCountingSimple.sol";
import "../../governance/extensions/GovernorVotesQuorumFraction.sol";

abstract contract GovernorMock is GovernorSettings, GovernorVotesQuorumFraction, GovernorCountingSimple {
    function proposalThreshold() public view override(Governor, GovernorSettings) returns (uint256) {
        return super.proposalThreshold();
    }
}
