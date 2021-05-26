// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

abstract contract IGovernor {
    enum ProposalState {
        Pending,
        Active,
        Canceled,
        Defeated,
        Succeeded,
        Queued,
        Expired,
        Executed
    }

    /**
     * Events
     */
    event ProposalCreated(uint256 indexed proposalId, address indexed proposer, address[] targets, uint256[] values, bytes[] calldatas, bytes32 salt, uint256 votingSnapshot, uint256 votingDeadline, string description);
    event ProposalCanceled(uint256 indexed proposalId);
    event ProposalExecuted(uint256 indexed proposalId);
    event VoteCast(address indexed voter, uint256 indexed proposalId, uint8 support, uint256 votes);

    /**
     * Public
     */
    function state(uint256 proposalId)
        public view virtual returns (ProposalState);

    function viewProposal(uint256 proposalId)
        public view virtual returns (uint256 startBlock, uint256 deadline, uint256 supply, uint256 score);

    function hashProposal(address[] memory targets, uint256[] memory values, bytes[] memory calldatas, bytes32 salt)
        public view virtual returns (uint256 proposalId);

    // No checks, can be added through inheritance
    function propose(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 salt,
        string memory description
    ) public virtual returns (uint256 proposalId);

    // No checks, can be added through inheritance
    function execute(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 salt
    ) public payable virtual returns (uint256 proposalId);

    function castVote(uint256 proposalId, uint8 support)
        public virtual;

    function castVoteBySig(uint256 proposalId, uint8 support, uint8 v, bytes32 r, bytes32 s)
        public virtual;

    // Abstract (required)
    function votingOffset()
        public view virtual returns (uint256) { return 0; }

    function votingDuration()
        public view virtual returns (uint256);

    function maxScore()
        public view virtual returns (uint8);

    function requiredScore()
        public view virtual returns (uint8);

    function quorum(uint256 blockNumber)
        public view virtual returns (uint256);

    function getVotes(address account, uint256 blockNumber)
        public view virtual returns(uint256);
}
