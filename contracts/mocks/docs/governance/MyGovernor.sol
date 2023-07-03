// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {IGovernor, Governor} from "../../../governance/Governor.sol";
import {GovernorCountingSimple} from "../../../governance/extensions/GovernorCountingSimple.sol";
import {GovernorVotes} from "../../../governance/extensions/GovernorVotes.sol";
import {GovernorVotesQuorumFraction} from "../../../governance/extensions/GovernorVotesQuorumFraction.sol";
import {GovernorTimelockControl} from "../../../governance/extensions/GovernorTimelockControl.sol";
import {TimelockController} from "../../../governance/TimelockController.sol";
import {IVotes} from "../../../governance/utils/IVotes.sol";
import {IERC165} from "../../../interfaces/IERC165.sol";

contract MyGovernor is
    Governor,
    GovernorCountingSimple,
    GovernorVotes,
    GovernorVotesQuorumFraction,
    GovernorTimelockControl
{
    constructor(
        IVotes _token,
        TimelockController _timelock
    ) Governor("MyGovernor") GovernorVotes(_token) GovernorVotesQuorumFraction(4) GovernorTimelockControl(_timelock) {}

    function votingDelay() public pure override returns (uint256) {
        return 7200; // 1 day
    }

    function votingPeriod() public pure override returns (uint256) {
        return 50400; // 1 week
    }

    function proposalThreshold() public pure override returns (uint256) {
        return 0;
    }

    // The functions below are overrides required by Solidity.

    function state(uint256 proposalId) public view override(Governor, GovernorTimelockControl) returns (ProposalState) {
        return super.state(proposalId);
    }

    function _queueCalls(
        uint256 proposalId,
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) internal override(Governor, GovernorTimelockControl) returns (bool, uint48) {
        return super._queueCalls(proposalId, targets, values, calldatas, descriptionHash);
    }

    function _executeCalls(
        uint256 proposalId,
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) internal override(Governor, GovernorTimelockControl) {
        super._executeCalls(proposalId, targets, values, calldatas, descriptionHash);
    }

    function _cancel(
        uint256 proposalId,
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) internal override(Governor, GovernorTimelockControl) {
        super._cancel(proposalId, targets, values, calldatas, descriptionHash);
    }

    function _executor() internal view override(Governor, GovernorTimelockControl) returns (address) {
        return super._executor();
    }
}
