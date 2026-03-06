// SPDX-License-Identifier: MIT

pragma solidity ^0.8.24;

import {Governor} from "../../governance/Governor.sol";
import {GovernorSettings} from "../../governance/extensions/GovernorSettings.sol";
import {GovernorCountingSimple} from "../../governance/extensions/GovernorCountingSimple.sol";
import {GovernorVotesQuorumFraction} from "../../governance/extensions/GovernorVotesQuorumFraction.sol";
import {GovernorCrosschain} from "../../governance/extensions/GovernorCrosschain.sol";

abstract contract GovernorCrosschainMock is
    GovernorSettings,
    GovernorVotesQuorumFraction,
    GovernorCountingSimple,
    GovernorCrosschain
{
    function proposalThreshold() public view override(Governor, GovernorSettings) returns (uint256) {
        return super.proposalThreshold();
    }
}
