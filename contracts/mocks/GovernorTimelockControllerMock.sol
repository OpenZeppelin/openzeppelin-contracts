// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../governance/extensions/GovernorTimelockController.sol";
import "../governance/extensions/GovernorCountingSimple.sol";
import "../governance/extensions/GovernorVotesQuorumFractional.sol";

contract GovernorTimelockControllerMock is
    GovernorTimelockController,
    GovernorVotesQuorumFractional,
    GovernorCountingSimple
{
    constructor(
        string memory name_,
        address token_,
        address timelock_,
        uint256 quorumRatio_
    )
        Governor(name_)
        GovernorTimelockController(timelock_)
        GovernorVotes(token_)
        GovernorVotesQuorumFractional(quorumRatio_)
    {}

    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override(Governor, GovernorTimelockController)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    function votingPeriod() public pure override(IGovernor, Governor) returns (uint256) {
        return 16; // blocks
    }

    function quorum(uint256 blockNumber)
        public
        view
        override(IGovernor, Governor, GovernorVotesQuorumFractional)
        returns (uint256)
    {
        return super.quorum(blockNumber);
    }

    function cancel(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) public returns (uint256 proposalId) {
        return _cancel(targets, values, calldatas, descriptionHash);
    }

    /**
     * Overriding nightmare
     */
    function state(uint256 proposalId)
        public
        view
        virtual
        override(Governor, GovernorTimelockController)
        returns (ProposalState)
    {
        return super.state(proposalId);
    }

    function _execute(
        uint256 proposalId,
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) internal virtual override(Governor, GovernorTimelockController) {
        super._execute(proposalId, targets, values, calldatas, descriptionHash);
    }

    function _cancel(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) internal virtual override(Governor, GovernorTimelockController) returns (uint256 proposalId) {
        return super._cancel(targets, values, calldatas, descriptionHash);
    }

    function getVotes(address account, uint256 blockNumber)
        public
        view
        virtual
        override(IGovernor, Governor, GovernorVotes)
        returns (uint256)
    {
        return super.getVotes(account, blockNumber);
    }

    function _executor() internal view virtual override(Governor, GovernorTimelockController) returns (address) {
        return super._executor();
    }
}
