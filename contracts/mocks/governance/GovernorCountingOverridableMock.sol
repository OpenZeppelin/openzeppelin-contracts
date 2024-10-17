// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {Governor} from "../../governance/Governor.sol";
import {GovernorSettings} from "../../governance/extensions/GovernorSettings.sol";
import {GovernorVotesQuorumFraction} from "../../governance/extensions/GovernorVotesQuorumFraction.sol";
import {GovernorCountingOverridable, VotesExtended} from "../../governance/extensions/GovernorCountingOverridable.sol";

abstract contract GovernorCountingOverridableMock is
    GovernorSettings,
    GovernorVotesQuorumFraction,
    GovernorCountingOverridable
{
    function proposalThreshold() public view override(Governor, GovernorSettings) returns (uint256) {
        return super.proposalThreshold();
    }
}
