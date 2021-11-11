// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../governance/compatibility/GovernorCompatibilityBravo.sol";
import "../governance/extensions/GovernorTimelockCompound.sol";
import "../governance/extensions/GovernorSettings.sol";
import "../governance/extensions/GovernorVotesComp.sol";

contract GovernorCompatibilityBravoMock is
    GovernorCompatibilityBravo,
    GovernorSettings,
    GovernorTimelockCompound,
    GovernorVotesComp
{
    constructor(
        string memory name_,
        ERC20VotesComp token_,
        uint256 votingDelay_,
        uint256 votingPeriod_,
        uint256 proposalThreshold_,
        ICompoundTimelock timelock_
    )
        Governor(name_)
        GovernorTimelockCompound(timelock_)
        GovernorSettings(votingDelay_, votingPeriod_, proposalThreshold_)
        GovernorVotesComp(token_)
    {}

    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override(IERC165, Governor, GovernorTimelockCompound)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    function quorum(uint256) public pure override returns (uint256) {
        return 0;
    }

    function state(uint256 proposalId)
        public
        view
        virtual
        override(IGovernor, Governor, GovernorTimelockCompound)
        returns (ProposalState)
    {
        return super.state(proposalId);
    }

    function proposalEta(uint256 proposalId)
        public
        view
        virtual
        override(IGovernorTimelock, GovernorTimelockCompound)
        returns (uint256)
    {
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
    ) public virtual override(IGovernor, Governor, GovernorCompatibilityBravo) returns (uint256) {
        return super.propose(targets, values, calldatas, description);
    }

    function queue(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 salt
    ) public virtual override(IGovernorTimelock, GovernorTimelockCompound) returns (uint256) {
        return super.queue(targets, values, calldatas, salt);
    }

    function execute(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 salt
    ) public payable virtual override(IGovernor, Governor) returns (uint256) {
        return super.execute(targets, values, calldatas, salt);
    }

    function _execute(
        uint256 proposalId,
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) internal virtual override(Governor, GovernorTimelockCompound) {
        super._execute(proposalId, targets, values, calldatas, descriptionHash);
    }

    /**
     * @notice WARNING: this is for mock purposes only. Ability to the _cancel function should be restricted for live
     * deployments.
     */
    function cancel(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 salt
    ) public returns (uint256 proposalId) {
        return _cancel(targets, values, calldatas, salt);
    }

    function _cancel(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 salt
    ) internal virtual override(Governor, GovernorTimelockCompound) returns (uint256 proposalId) {
        return super._cancel(targets, values, calldatas, salt);
    }

    function getVotes(address account, uint256 blockNumber)
        public
        view
        virtual
        override(IGovernor, GovernorVotesComp)
        returns (uint256)
    {
        return super.getVotes(account, blockNumber);
    }

    function _executor() internal view virtual override(Governor, GovernorTimelockCompound) returns (address) {
        return super._executor();
    }
}
