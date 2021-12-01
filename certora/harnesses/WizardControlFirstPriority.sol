// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

import "../munged/governance/Governor.sol";
import "../munged/governance/extensions/GovernorCountingSimple.sol";
import "../munged/governance/extensions/GovernorVotes.sol";
import "../munged/governance/extensions/GovernorVotesQuorumFraction.sol";
import "../munged/governance/extensions/GovernorTimelockControl.sol";
import "../munged/governance/extensions/GovernorProposalThreshold.sol";

/* 
Wizard options:
ProposalThreshhold = 10
ERC20Votes
TimelockController
*/

contract WizardControlFirstPriority is Governor, GovernorProposalThreshold, GovernorCountingSimple, GovernorVotes, GovernorVotesQuorumFraction, GovernorTimelockControl {
    constructor(ERC20Votes _token, TimelockController _timelock, string memory name, uint256 quorumFraction)
        Governor(name)
        GovernorVotes(_token)
        GovernorVotesQuorumFraction(quorumFraction)
        GovernorTimelockControl(_timelock)
    {}

    //HARNESS

    function isExecuted(uint256 proposalId) public view returns (bool) {
        return _proposals[proposalId].executed;
    }
    
    function isCanceled(uint256 proposalId) public view returns (bool) {
        return _proposals[proposalId].canceled;
    }

    uint256 _votingDelay;

    uint256 _votingPeriod;

    uint256 _proposalThreshold;

    mapping(uint256 => uint256) public ghost_sum_vote_power_by_id;

    function _castVote(
        uint256 proposalId,
        address account,
        uint8 support,
        string memory reason
    ) internal override virtual returns (uint256) {
        
        uint256 deltaWeight = super._castVote(proposalId, account, support, reason);  //HARNESS
        ghost_sum_vote_power_by_id[proposalId] += deltaWeight;

        return deltaWeight;        
    }
    
    function snapshot(uint256 proposalId) public view returns (uint64) {
        return _proposals[proposalId].voteStart._deadline;
    }


    function getExecutor() public view returns (address){
        return _executor();
    }

    // original code, harnessed

    function votingDelay() public view override returns (uint256) {     // HARNESS: pure -> view
        return _votingDelay;                                            // HARNESS: parametric
    }

    function votingPeriod() public view override returns (uint256) {    // HARNESS: pure -> view
        return _votingPeriod;                                           // HARNESS: parametric
    }

    function proposalThreshold() public view override returns (uint256) {   // HARNESS: pure -> view
        return _proposalThreshold;                                          // HARNESS: parametric
    }

    // original code, not harnessed
    // The following functions are overrides required by Solidity.

    function quorum(uint256 blockNumber)
        public
        view
        override(IGovernor, GovernorVotesQuorumFraction)
        returns (uint256)
    {
        return super.quorum(blockNumber);
    }

    function getVotes(address account, uint256 blockNumber)
        public
        view
        override(IGovernor, GovernorVotes)
        returns (uint256)
    {
        return super.getVotes(account, blockNumber);
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
        override(Governor, GovernorProposalThreshold, IGovernor)
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
