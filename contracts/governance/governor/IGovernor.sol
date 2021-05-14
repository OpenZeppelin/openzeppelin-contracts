// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

abstract contract IGovernor {
    /**
     * Events
     */
    event ProposalCreated(bytes32 indexed proposalId, address[] targets, uint256[] values, bytes[] calldatas, bytes32 salt);
    event ProposalExecuted(bytes32 indexed proposalId);
    event VoteCast(address indexed voter, bytes32 indexed proposalId, uint8 support, uint256 votes);

    /**
     * Public
     */
    function viewProposalStatus(bytes32 proposalId)
        public view virtual returns (uint8 status);

    function viewProposal(bytes32 proposalId)
        public view virtual returns (uint256 startBlock, uint256 deadline, uint256 supply, uint256 score);

    function hashProposal(address[] calldata target, uint256[] calldata value, bytes[] calldata data, bytes32 salt)
        public view virtual returns (bytes32 proposalId);

    // No checks, can be added through inheritance
    function propose(
        address[] calldata targets,
        uint256[] calldata values,
        bytes[] calldata calldatas,
        bytes32 salt
    ) public virtual returns (bytes32 proposalId);

    // No checks, can be added through inheritance
    function execute(
        address[] calldata targets,
        uint256[] calldata values,
        bytes[] calldata calldatas,
        bytes32 salt
    ) public virtual returns (bytes32 proposalId);

    function castVote(uint256 proposalId, uint8 support)
        public virtual;

    function castVoteBySig(uint256 proposalId, uint8 support, uint8 v, bytes32 r, bytes32 s)
        public virtual;

    // Abstract (required)
    function votingOffset()
        public view virtual returns (uint256);

    function votingDuration()
        public view virtual returns (uint256);

    function quorum()
        public view virtual returns (uint256);

    function maxScore()
        public view virtual returns (uint8);

    function requiredScore()
        public view virtual returns (uint8);

    function getVotes(address account, uint256 blockNumber)
        public view virtual returns(uint256);
}
