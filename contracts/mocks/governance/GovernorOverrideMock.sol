// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {Governor} from "../../governance/Governor.sol";
import {GovernorSettings} from "../../governance/extensions/GovernorSettings.sol";
import {GovernorVotesQuorumFraction} from "../../governance/extensions/GovernorVotesQuorumFraction.sol";
import {GovernorOverrideDelegateVote, VotesOverridable} from "../../governance/extensions/GovernorOverrideDelegateVote.sol";

contract GovernorOverrideMock is GovernorSettings, GovernorOverrideDelegateVote {
    constructor(
        VotesOverridable token,
        uint48 initialVotingDelay,
        uint32 initialVotingPeriod,
        uint256 initialProposalThreshold
    )
        Governor("Mock Override Governor")
        GovernorOverrideDelegateVote(token)
        GovernorSettings(initialVotingDelay, initialVotingPeriod, initialProposalThreshold)
    {}

    function proposalThreshold() public view override(Governor, GovernorSettings) returns (uint256) {
        return super.proposalThreshold();
    }

    function quorum(uint256) public pure override returns (uint256) {
        return 1000e18;
    }
}
