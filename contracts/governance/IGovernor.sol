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

/**
 * @dev Interface of the {Governor} core.
 *
 * _Available since v4.2._
 */
abstract contract IGovernor {
    /**
     * @dev Emitted when a proposal is created.
     */
    event ProposalCreated(uint256 indexed proposalId, address indexed proposer, address[] targets, uint256[] values, bytes[] calldatas, bytes32 salt, uint256 votingSnapshot, uint256 votingDeadline, string description);

    /**
     * @dev Emitted when a proposal is canceled.
     */
    event ProposalCanceled(uint256 indexed proposalId);

    /**
     * @dev Emitted when a proposal is executed.
     */
    event ProposalExecuted(uint256 indexed proposalId);

    /**
     * @dev Emitted when a vote is casted.
     *
     * Note: `support` values should be seen as buckets. There interpretation depends on the voting module used.
     */
    event VoteCast(address indexed voter, uint256 indexed proposalId, uint8 support, uint256 weight);

    /**
     * @dev Name of the governor instance (used in building the ERC712 domain separator).
     */
    function name() external view virtual returns (string memory);

    /**
     * @dev Version of the governor instance (used in building the ERC712 domain separator).
     */
    function version() external view virtual returns (string memory);

    /**
     * @dev Current state of a proposal, following Compound's convention
     */
    function state(uint256 proposalId) public view virtual returns (ProposalState);

    /**
     * @dev Proposal deadline: timestamp at which votes close.
     */
    function proposalDeadline(uint256 proposalId) public view virtual returns (uint256);

    /**
     * @dev Proposal snapshot: block number used to retrieve user's votes and quorum.
     */
    function proposalSnapshot(uint256 proposalId) public view virtual returns (uint256);

    /**
     * @dev Proposal weight: amont of votes already casted.
     */
    function proposalWeight(uint256 proposalId) public view virtual returns (uint256);

    /**
     * @dev Returns weither `account` has casted a vote on `proposalId`.
     */
    function hasVoted(uint256 proposalId, address account) public view virtual returns (bool);

    /**
     * @dev Minimum number of casted voted requiered for a proposal to be successfull.
     *
     * Note: The `blockNumber` parameter corresponds to the snaphot used for counting vote. This allows to scale the
     * quroum depending on values such as the totalSupply of a token at this block (see {ERC20Votes}).
     */
    function quorum(uint256 blockNumber) public view virtual returns (uint256);

    /**
     * @dev Voting power of an `account` at a specific `blockNumber`.
     *
     * Note: this can be implemented in a number of ways, for example by reading the delegated balance from one (or
     * multiple), {ERC20Votes} tokens.
     */
    function getVotes(address account, uint256 blockNumber) public view virtual returns(uint256);

    /**
     * @dev Delay, in number of block, between the proposal is created and the vote starts. This can be increassed to
     * leave time for users to buy voting power, of delegate it, before the voting of a proposal starts.
     *
     * Default: 0
     */
    function votingDelay() public view virtual returns (uint256) { return 0; }

    /**
     * @dev Delay, in number of seconds, between the proposal is created and the vote ends.
     *
     * Note: the {votingDelay} can delay the start of the vote. This must be considered when setting the voting
     * duration compared to the voting delay.
     */
    function votingDuration() public view virtual returns (uint256);

    /**
     * @dev Hashing function used to (re)build the proposal id from the proposal details.
     */
    function hashProposal(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 salt
    ) public view virtual returns (uint256 proposalId);

    /**
     * @dev Create a new proposal. Vote start {IGovernor-votingDelay} blocks after the proposal is created and ends
     * {IGovernor-votingDuration} seconds after the proposal is created.
     *
     * Emits a {ProposalCreated} event.
     */
    function propose(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 salt,
        string memory description
    ) public virtual returns (uint256 proposalId);

    /**
     * @dev Execute a successfull proposal. This requiers the quorum to be reached, the vote to be successfull, and the
     * deadline to be reached.
     *
     * Emits a {ProposalExecuted} event.
     *
     * Note: some module can modify the requierements for execution, for example by adding an additional timelock.
     */
    function execute(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 salt
    ) public payable virtual returns (uint256 proposalId);

    /**
     * @dev Cast a vote
     *
     * Emits a {VoteCast} event.
     */
    function castVote(
        uint256 proposalId,
        uint8 support
    ) public virtual returns (uint256 balance);

    /**
     * @dev Cast a vote using the user cryptographic signature.
     *
     * Emits a {VoteCast} event.
     */
    function castVoteBySig(
        uint256 proposalId,
        uint8 support,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) public virtual returns (uint256 balance);

    /**
     * @dev Internal abstract interface to the voting module: returns weither a proposal is successfull or not.
     */
    function _voteSuccess(uint256 proposalId) internal view virtual returns (bool);

    /**
     * @dev Internal abstract interface to the voting module: register a vote with a given support and voting weight.
     *
     * Note: Support is generic and can represent various things depending
     * on the voting system used.
     */
    function _pushVote(uint256 proposalId, address account, uint8 support, uint256 weight) internal virtual;
}
