// SPDX-License-Identifier: MIT

pragma solidity ^0.8.24;

import {Governor} from "../../governance/Governor.sol";
import {GovernorSettings} from "../../governance/extensions/GovernorSettings.sol";
import {GovernorCountingSimple} from "../../governance/extensions/GovernorCountingSimple.sol";
import {GovernorVotesQuorumFraction} from "../../governance/extensions/GovernorVotesQuorumFraction.sol";
import {GovernorProposalGuardian} from "../../governance/extensions/GovernorProposalGuardian.sol";

abstract contract GovernorProposalGuardianMock is
    GovernorSettings,
    GovernorVotesQuorumFraction,
    GovernorCountingSimple,
    GovernorProposalGuardian
{
    function proposalThreshold() public view override(Governor, GovernorSettings) returns (uint256) {
        return super.proposalThreshold();
    }

    function _validateCancel(
        uint256 proposalId,
        address caller
    ) internal view override(Governor, GovernorProposalGuardian) returns (bool) {
        return super._validateCancel(proposalId, caller);
    }
}
