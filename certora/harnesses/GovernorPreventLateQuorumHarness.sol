// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

import "../munged/governance/extensions/GovernorPreventLateQuorum.sol";
import "../munged/governance/Governor.sol";
import "../munged/governance/extensions/GovernorCountingSimple.sol";
import "../munged/governance/extensions/GovernorVotes.sol";
import "../munged/governance/extensions/GovernorVotesQuorumFraction.sol";
import "../munged/governance/extensions/GovernorTimelockControl.sol";
import "../munged/token/ERC20/extensions/ERC20Votes.sol";

contract GovernorPreventLateQuorumHarness is Governor, GovernorCountingSimple, GovernorVotes, GovernorVotesQuorumFraction, GovernorTimelockControl, GovernorPreventLateQuorum {
    using SafeCast for uint256;
    using Timers for Timers.BlockNumber;
    constructor(IVotes _token, TimelockController _timelock, uint64 initialVoteExtension, uint256 quorumNumeratorValue)
        Governor("Harness")
        GovernorVotes(_token)
        GovernorVotesQuorumFraction(quorumNumeratorValue)
        GovernorTimelockControl(_timelock)
        GovernorPreventLateQuorum(initialVoteExtension)
    {}

    // variable added to check when _castVote is called
    uint256 public latestCastVoteCall;

    // Harness from GovernorPreventLateQuorum //
    
    function getVoteExtension() public view returns(uint64) {
        return _voteExtension;
    }

    function getExtendedDeadlineIsUnset(uint256 id) public view returns(bool) {
        return _extendedDeadlines[id].isUnset();
    }

    function getExtendedDeadline(uint256 id) public view returns(uint64) {
        return _extendedDeadlines[id].getDeadline();
    }

    // Harness from GovernorCountingSimple // 
    
    function  quorumReached(uint256 proposalId) public view returns(bool) {
        return _quorumReached(proposalId);
    }

    // Harness from Governor //

    function isExecuted(uint256 proposalId) public view returns (bool) {
        return _proposals[proposalId].executed;
    }
    
    function isCanceled(uint256 proposalId) public view returns (bool) {
        return _proposals[proposalId].canceled;
    }

    // The following functions are overrides required by Solidity added by Certora. //

    function proposalDeadline(uint256 proposalId) public view virtual override(Governor, GovernorPreventLateQuorum, IGovernor) returns (uint256) {
        return super.proposalDeadline(proposalId);
    }

    function _castVote(
        uint256 proposalId,
        address account,
        uint8 support,
        string memory reason,
        bytes memory params
    ) internal virtual override(Governor, GovernorPreventLateQuorum) returns (uint256) {
        latestCastVoteCall = block.number;
        return super._castVote(proposalId, account, support, reason, params);
    }

    function castVote(
        uint256 proposalId,
        address account,
        uint8 support,
        string memory reason,
        bytes memory params
    ) public returns(uint256) {
        return _castVote(proposalId, account, support, reason, params);
    }

    function lateQuorumVoteExtension() public view virtual override returns (uint64) {
        return super.lateQuorumVoteExtension();
    }

    function setLateQuorumVoteExtension(uint64 newVoteExtension) public virtual override onlyGovernance {
        super.setLateQuorumVoteExtension(newVoteExtension);
    }

    // The following functions are overrides required by Solidity added by OZ Wizard. //

    function votingDelay() public pure override returns (uint256) {
        return 1; // 1 block
    }

    function votingPeriod() public pure override returns (uint256) {
        return 45818; // 1 week
    }

    function quorum(uint256 blockNumber)
        public
        view
        override(IGovernor, GovernorVotesQuorumFraction)
        returns (uint256)
    {
        return super.quorum(blockNumber);
    }

    function state(uint256 proposalId)
        public
        view
        override(Governor, GovernorTimelockControl)
        returns (ProposalState)
    {
        return super.state(proposalId);
    }

    function propose(address[] memory targets, uint256[] memory values, bytes[] memory calldatas, string memory description)
        public
        override(Governor, IGovernor)
        returns (uint256)
    {
        return super.propose(targets, values, calldatas, description);
    }

    function _execute(uint256 proposalId, address[] memory targets, uint256[] memory values, bytes[] memory calldatas, bytes32 descriptionHash)
        internal
        override(Governor, GovernorTimelockControl)
    {
        super._execute(proposalId, targets, values, calldatas, descriptionHash);
    }

    function _cancel(address[] memory targets, uint256[] memory values, bytes[] memory calldatas, bytes32 descriptionHash)
        internal
        override(Governor, GovernorTimelockControl)
        returns (uint256)
    {
        return super._cancel(targets, values, calldatas, descriptionHash);
    }

    function _executor()
        internal
        view
        override(Governor, GovernorTimelockControl)
        returns (address)
    {
        return super._executor();
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(Governor, GovernorTimelockControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}