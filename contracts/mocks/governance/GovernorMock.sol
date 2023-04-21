// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../../governance/extensions/GovernorProposalThreshold.sol";
import "../../governance/extensions/GovernorSettings.sol";
import "../../governance/extensions/GovernorCountingSimple.sol";
import "../../governance/extensions/GovernorVotesQuorumFraction.sol";

abstract contract GovernorMock is
    GovernorProposalThreshold,
    GovernorSettings,
    GovernorVotesQuorumFraction,
    GovernorCountingSimple
{
    function proposalThreshold() public view override(Governor, GovernorSettings) returns (uint256) {
        return super.proposalThreshold();
    }

    function propose(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        string memory description
    ) public override(Governor, GovernorProposalThreshold) returns (uint256) {
        return super.propose(targets, values, calldatas, description);
    }
}
