// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../governance/extensions/GovernorTimelockController.sol";
import "../governance/extensions/GovernorVotingSimple.sol";
import "../governance/extensions/GovernorWeightQuorumFractional.sol";

contract GovernorTimelockControllerMock is
    GovernorTimelockController,
    GovernorWeightQuorumFractional,
    GovernorVotingSimple
{
    constructor(
        string memory name_,
        address token_,
        address timelock_,
        uint256 quorumRatio_
    )
        Governor(name_)
        GovernorTimelockController(timelock_)
        GovernorWeight(token_)
        GovernorWeightQuorumFractional(quorumRatio_)
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
        override(IGovernor, Governor, GovernorWeightQuorumFractional)
        returns (uint256)
    {
        return super.quorum(blockNumber);
    }

    function cancel(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 salt
    ) public returns (uint256 proposalId) {
        return _cancel(targets, values, calldatas, salt);
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

    function execute(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 salt
    ) public payable virtual override(Governor, GovernorTimelockController) returns (uint256 proposalId) {
        return super.execute(targets, values, calldatas, salt);
    }

    function _cancel(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 salt
    ) internal virtual override(Governor, GovernorTimelockController) returns (uint256 proposalId) {
        return super._cancel(targets, values, calldatas, salt);
    }

    function getVotes(address account, uint256 blockNumber)
        public
        view
        virtual
        override(IGovernor, Governor, GovernorWeight)
        returns (uint256)
    {
        return super.getVotes(account, blockNumber);
    }

    function _executor() internal view virtual override(Governor, GovernorTimelockController) returns (address) {
        return super._executor();
    }
}
