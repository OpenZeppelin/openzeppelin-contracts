// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../../governance/compatibility/GovernorCompatibilityBravo.sol";
import "../../governance/extensions/GovernorTimelockCompound.sol";
import "../../governance/extensions/GovernorSettings.sol";
import "../../governance/extensions/GovernorVotesComp.sol";

abstract contract GovernorCompatibilityBravoMock is
    GovernorCompatibilityBravo,
    GovernorSettings,
    GovernorTimelockCompound,
    GovernorVotesComp
{
    function quorum(uint256) public pure override returns (uint256) {
        return 0;
    }

    function supportsInterface(
        bytes4 interfaceId
    ) public view override(IERC165, Governor, GovernorTimelockCompound) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    function state(
        uint256 proposalId
    ) public view override(IGovernor, Governor, GovernorTimelockCompound) returns (ProposalState) {
        return super.state(proposalId);
    }

    function proposalEta(
        uint256 proposalId
    ) public view override(IGovernorTimelock, GovernorTimelockCompound) returns (uint256) {
        return super.proposalEta(proposalId);
    }

    function proposalThreshold() public view override(Governor, GovernorSettings) returns (uint256) {
        return super.proposalThreshold();
    }

    function propose(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        string memory description
    ) public override(IGovernor, Governor, GovernorCompatibilityBravo) returns (uint256) {
        return super.propose(targets, values, calldatas, description);
    }

    function queue(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 salt
    ) public override(IGovernorTimelock, GovernorTimelockCompound) returns (uint256) {
        return super.queue(targets, values, calldatas, salt);
    }

    function execute(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 salt
    ) public payable override(IGovernor, Governor) returns (uint256) {
        return super.execute(targets, values, calldatas, salt);
    }

    function cancel(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) public override(Governor, GovernorCompatibilityBravo, IGovernor) returns (uint256) {
        return super.cancel(targets, values, calldatas, descriptionHash);
    }

    function _execute(
        uint256 proposalId,
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) internal override(Governor, GovernorTimelockCompound) {
        super._execute(proposalId, targets, values, calldatas, descriptionHash);
    }

    function _cancel(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 salt
    ) internal override(Governor, GovernorTimelockCompound) returns (uint256 proposalId) {
        return super._cancel(targets, values, calldatas, salt);
    }

    function _executor() internal view override(Governor, GovernorTimelockCompound) returns (address) {
        return super._executor();
    }
}
