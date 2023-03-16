// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

import "../patched/governance/Governor.sol";
import "../patched/governance/extensions/GovernorCountingSimple.sol";
import "../patched/governance/extensions/GovernorTimelockControl.sol";
import "../patched/governance/extensions/GovernorVotes.sol";
import "../patched/governance/extensions/GovernorVotesQuorumFraction.sol";
import "../patched/token/ERC20/extensions/ERC20Votes.sol";

contract GovernorHarness is
    Governor,
    GovernorCountingSimple,
    GovernorTimelockControl,
    GovernorVotes,
    GovernorVotesQuorumFraction
{
    constructor(IVotes _token, TimelockController _timelock, uint256 _quorumNumeratorValue)
        Governor("Harness")
        GovernorTimelockControl(_timelock)
        GovernorVotes(_token)
        GovernorVotesQuorumFraction(_quorumNumeratorValue)
    {}

    // Harness from Votes
    function token_getPastTotalSupply(uint256 blockNumber) public view returns(uint256) {
        return token.getPastTotalSupply(blockNumber);
    }

    function token_getPastVotes(address account, uint256 blockNumber) public view returns(uint256) {
        return token.getPastVotes(account, blockNumber);
    }

    function token_clock() public view returns (uint48) {
        return token.clock();
    }

    function token_CLOCK_MODE() public view returns (string memory) {
        return token.CLOCK_MODE();
    }

    // Harness from Governor
    function hashProposal(address[] memory targets,uint256[] memory values,bytes[] memory calldatas,string memory description) public returns (uint256) {
        return hashProposal(targets, values, calldatas, keccak256(bytes(description)));
    }

    function getExecutor() public view returns (address) {
        return _executor();
    }

    function proposalProposer(uint256 proposalId) public view returns (address) {
        return _proposalProposer(proposalId);
    }

    function quorumReached(uint256 proposalId) public view returns (bool) {
        return _quorumReached(proposalId);
    }

    function voteSucceeded(uint256 proposalId) public view returns (bool) {
        return _voteSucceeded(proposalId);
    }

    function isExecuted(uint256 proposalId) public view returns (bool) {
        return _isExecuted(proposalId);
    }

    function isCanceled(uint256 proposalId) public view returns (bool) {
        return _isCanceled(proposalId);
    }

    function isQueued(uint256 proposalId) public view returns (bool) {
        return _proposalQueueId(proposalId) != bytes32(0);
    }

    function governanceCallLength() public view returns (uint256) {
        return _governanceCallLength();
    }

    // Harness from GovernorCountingSimple
    function getAgainstVotes(uint256 proposalId) public view returns (uint256) {
        (uint256 againstVotes,,) = proposalVotes(proposalId);
        return againstVotes;
    }

    function getForVotes(uint256 proposalId) public view returns (uint256) {
        (,uint256 forVotes,) = proposalVotes(proposalId);
        return forVotes;
    }

    function getAbstainVotes(uint256 proposalId) public view returns (uint256) {
        (,,uint256 abstainVotes) = proposalVotes(proposalId);
        return abstainVotes;
    }

    // The following functions are overrides required by Solidity added by OZ Wizard.
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
