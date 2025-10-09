// SPDX-License-Identifier: MIT

pragma solidity ^0.8.24;

import {Governor} from "../../governance/Governor.sol";
import {GovernorSettings} from "../../governance/extensions/GovernorSettings.sol";
import {GovernorSuperQuorum} from "../../governance/extensions/GovernorSuperQuorum.sol";
import {GovernorCountingSimple} from "../../governance/extensions/GovernorCountingSimple.sol";
import {GovernorVotesSuperQuorumFraction} from "../../governance/extensions/GovernorVotesSuperQuorumFraction.sol";

abstract contract GovernorVotesSuperQuorumFractionMock is
    GovernorSettings,
    GovernorVotesSuperQuorumFraction,
    GovernorCountingSimple
{
    function proposalThreshold() public view override(Governor, GovernorSettings) returns (uint256) {
        return super.proposalThreshold();
    }

    function proposalVotes(
        uint256 proposalId
    )
        public
        view
        virtual
        override(GovernorCountingSimple, GovernorSuperQuorum)
        returns (uint256 againstVotes, uint256 forVotes, uint256 abstainVotes)
    {
        return super.proposalVotes(proposalId);
    }

    function state(
        uint256 proposalId
    ) public view override(Governor, GovernorVotesSuperQuorumFraction) returns (ProposalState) {
        return super.state(proposalId);
    }
}
