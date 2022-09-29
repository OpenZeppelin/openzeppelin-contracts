// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

import "../munged/governance/Governor.sol";
import "../munged/governance/extensions/GovernorCountingSimple.sol";
import "../munged/governance/extensions/GovernorPreventLateQuorum.sol";
import "../munged/governance/extensions/GovernorTimelockControl.sol";
import "../munged/governance/extensions/GovernorVotes.sol";
import "../munged/governance/extensions/GovernorVotesQuorumFraction.sol";
import "../munged/token/ERC20/extensions/ERC20Votes.sol";

contract GovernorFullHarness is
    Governor,
    GovernorCountingSimple,
    GovernorTimelockControl,
    GovernorPreventLateQuorum,
    GovernorVotes,
    GovernorVotesQuorumFraction
{
    using SafeCast for uint256;
    using Timers for Timers.BlockNumber;

    constructor(
        IVotes _token,
        TimelockController _timelock,
        uint64 initialVoteExtension,
        uint256 quorumNumeratorValue
    )
        Governor("Harness")
        GovernorPreventLateQuorum(initialVoteExtension)
        GovernorTimelockControl(_timelock)
        GovernorVotes(_token)
        GovernorVotesQuorumFraction(quorumNumeratorValue)
    {}

    mapping(uint256 => uint256) public ghost_sum_vote_power_by_id;

    // variable added to check when _castVote is called
    uint256 public latestCastVoteCall;

    // Harness from GovernorPreventLateQuorum //

    function getVoteExtension() public view returns (uint64) {
        return _voteExtension;
    }

    function getExtendedDeadlineIsUnset(uint256 proposalId) public view returns (bool) {
        return _extendedDeadlines[proposalId].isUnset();
    }

    function getExtendedDeadlineIsStarted(uint256 proposalId) public view returns (bool) {
        return _extendedDeadlines[proposalId].isStarted();
    }

    function getExtendedDeadline(uint256 proposalId) public view returns (uint64) {
        return _extendedDeadlines[proposalId].getDeadline();
    }

    // Harness from GovernorCountingSimple //

    function getAgainstVotes(uint256 proposalId) public view returns (uint256) {
        ProposalVote storage proposalvote = _proposalVotes[proposalId];
        return proposalvote.againstVotes;
    }

    function getAbstainVotes(uint256 proposalId) public view returns (uint256) {
        ProposalVote storage proposalvote = _proposalVotes[proposalId];
        return proposalvote.abstainVotes;
    }

    function getForVotes(uint256 proposalId) public view returns (uint256) {
        ProposalVote storage proposalvote = _proposalVotes[proposalId];
        return proposalvote.forVotes;
    }

    function quorumReached(uint256 proposalId) public view returns (bool) {
        return _quorumReached(proposalId);
    }

    function voteSucceeded(uint256 proposalId) public view returns (bool) {
        return _voteSucceeded(proposalId);
    }

    // Harness from Governor //

    function getExecutor() public view returns (address) {
        return _executor();
    }

    function isExecuted(uint256 proposalId) public view returns (bool) {
        return _proposals[proposalId].executed;
    }

    function isCanceled(uint256 proposalId) public view returns (bool) {
        return _proposals[proposalId].canceled;
    }

    // The following functions are overrides required by Solidity added by Certora. //

    function proposalDeadline(uint256 proposalId)
        public
        view
        virtual
        override(Governor, GovernorPreventLateQuorum, IGovernor)
        returns (uint256)
    {
        return super.proposalDeadline(proposalId);
    }

    function _castVote(
        uint256 proposalId,
        address account,
        uint8 support,
        string memory reason,
        bytes memory params
    ) internal virtual override(Governor, GovernorPreventLateQuorum) returns (uint256) {
        // flag for when _castVote is called
        latestCastVoteCall = block.number;

        // added to run GovernorCountingSimple.spec
        uint256 deltaWeight = super._castVote(proposalId, account, support, reason, params);
        ghost_sum_vote_power_by_id[proposalId] += deltaWeight;

        return deltaWeight;
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

    function state(uint256 proposalId) public view override(Governor, GovernorTimelockControl) returns (ProposalState) {
        return super.state(proposalId);
    }

    function propose(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        string memory description
    ) public override(Governor, IGovernor) returns (uint256) {
        return super.propose(targets, values, calldatas, description);
    }

    function _execute(
        uint256 proposalId,
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) internal override(Governor, GovernorTimelockControl) {
        super._execute(proposalId, targets, values, calldatas, descriptionHash);
    }

    function _cancel(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) internal override(Governor, GovernorTimelockControl) returns (uint256) {
        return super._cancel(targets, values, calldatas, descriptionHash);
    }

    function _executor() internal view override(Governor, GovernorTimelockControl) returns (address) {
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
