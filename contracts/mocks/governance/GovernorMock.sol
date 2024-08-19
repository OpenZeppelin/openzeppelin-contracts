// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {Governor} from "../../governance/Governor.sol";
import {GovernorSettings} from "../../governance/extensions/GovernorSettings.sol";
import {GovernorCountingSimple} from "../../governance/extensions/GovernorCountingSimple.sol";
import {GovernorVotesQuorumFraction} from "../../governance/extensions/GovernorVotesQuorumFraction.sol";

abstract contract GovernorMock is GovernorSettings, GovernorVotesQuorumFraction, GovernorCountingSimple {
    function proposalThreshold() public view override(Governor, GovernorSettings) returns (uint256) {
        return super.proposalThreshold();
    }
}
