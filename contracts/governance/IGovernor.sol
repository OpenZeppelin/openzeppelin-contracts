// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

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

abstract contract IGovernor {
    event ProposalCreated(uint256 indexed proposalId, address indexed proposer, address[] targets, uint256[] values, bytes[] calldatas, bytes32 salt, uint256 votingSnapshot, uint256 votingDeadline, string description);
    event ProposalCanceled(uint256 indexed proposalId);
    event ProposalExecuted(uint256 indexed proposalId);
    event VoteCast(address indexed voter, uint256 indexed proposalId, uint8 support, uint256 weight);

    function name() external view virtual returns (string memory);
    function version() external view virtual returns (string memory);

    function state(uint256 proposalId) public view virtual returns (ProposalState);
    function proposalDeadline(uint256 proposalId) public view virtual returns (uint256);
    function proposalSnapshot(uint256 proposalId) public view virtual returns (uint256);
    function proposalWeight(uint256 proposalId) public view virtual returns (uint256);
    function hasVoted(uint256 proposalId, address account) public view virtual returns (bool);

    function hashProposal(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 salt
    ) public view virtual returns (uint256 proposalId);

    function propose(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 salt,
        string memory description
    ) public virtual returns (uint256 proposalId);

    function execute(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 salt
    ) public payable virtual returns (uint256 proposalId);

    function castVote(
        uint256 proposalId,
        uint8 support
    ) public virtual returns (uint256 balance);

    function castVoteBySig(
        uint256 proposalId,
        uint8 support,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) public virtual returns (uint256 balance);

    // Vote configuration
    function votingDelay() public view virtual returns (uint256) { return 0; }
    function votingDuration() public view virtual returns (uint256);
    function quorum(uint256 blockNumber) public view virtual returns (uint256);
    function getVotes(address account, uint256 blockNumber) public view virtual returns(uint256);

    // Binding to voting system (internal)
    function _voteSuccess(uint256 proposalId) internal view virtual returns (bool);
    function _pushVote(uint256 proposalId, uint8 support, uint256 weight) internal virtual;
}
