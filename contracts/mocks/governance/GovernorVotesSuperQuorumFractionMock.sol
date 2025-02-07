// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

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

    function state(
        uint256 proposalId
    ) public view override(Governor, GovernorVotesSuperQuorumFraction) returns (ProposalState) {
        return super.state(proposalId);
    }
}
