// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {Governor} from "../../governance/Governor.sol";
import {GovernorSettings} from "../../governance/extensions/GovernorSettings.sol";
import {GovernorVotesQuorumFraction} from "../../governance/extensions/GovernorVotesQuorumFraction.sol";
import {GovernorOverrideDelegateVote, VotesOverridable} from "../../governance/extensions/GovernorOverrideDelegateVote.sol";
import {GovernorVotesQuorumFraction} from "../../governance/extensions/GovernorVotesQuorumFraction.sol";

abstract contract GovernorOverrideDelegateVoteMock is
    GovernorSettings,
    GovernorVotesQuorumFraction,
    GovernorOverrideDelegateVote
{
    function proposalThreshold() public view override(Governor, GovernorSettings) returns (uint256) {
        return super.proposalThreshold();
    }
}
