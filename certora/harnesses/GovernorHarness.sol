import "../../contracts/governance/Governor.sol";

contract GovernorHarness is Governor {

    function isExecuted(uint256 proposalId) public view returns (bool) {
        return _proposals[proposalId].executed;
    }
    
    function isCanceled(uint256 proposalId) public view returns (bool) {
        return _proposals[proposalId].canceled;
    }

    function snapshot(uint256 proposalId) public view returns (uint64) {
        return _proposals[proposalId].voteStart._deadline;
    }


    function initialized(uint256 proposalId) public view returns (bool){
        if (_proposals[proposalId].voteStart._deadline != 0 && _proposals[proposalId].voteEnd._deadline != 0) {
            return true;
        }
        return false;
    }


    mapping(uint256 => uint256) _quorum;

    function quorum(uint256 blockNumber) public view override virtual returns (uint256) {
        return _quorum[blockNumber];
    }


    mapping (address => mapping (uint256 => uint256)) _getVotes;

    function getVotes(address account, uint256 blockNumber) public view override virtual returns (uint256) {
        return _getVotes[account][blockNumber];
    }


    mapping (uint256 => bool) __quoromReached;

    function _quorumReached(uint256 proposalId) public view override virtual returns (bool) {
        return __quoromReached[proposalId];
    }


    mapping (uint256 => bool) __voteSucceeded;

    function _voteSucceeded(uint256 proposalId) public view override virtual returns (bool) {
        return __voteSucceeded[proposalId];
    }


    //string _COUNTING_MODE;
    function COUNTING_MODE() public pure override virtual returns (string memory) {
        return "dummy";
    }


    mapping(uint256 => mapping(address => bool)) _hasVoted;

    function hasVoted(uint256 proposalId, address account) public view override virtual returns (bool) {
        return _hasVoted[proposalId][account];
    }


    uint256 _votingDelay;

    function votingDelay() public view override virtual returns (uint256) {
        return _votingDelay;
    }


    uint256 _votingPeriod;
    
    function votingPeriod() public view override virtual returns (uint256) {
        return _votingPeriod;
    }


    function _countVote(
        uint256 proposalId,
        address account,
        uint8 support,
        uint256 weight
    ) internal override virtual {
        // havoc something
    }


    constructor(string memory name) Governor(name) {}

    // _countVots == Sum of castVote
    // 
    // RHS:
    // 1) use counter_vote_power as a counter
    // 2) use counter_vote_power as a temp var for a ghost
    // 
    // LHS:
    // mapping of count
    // countMap

    // uint decision;
    // uint numberOfOptions;

    function callPropose(address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas) public virtual returns (uint256) {
        return super.propose(targets, values, calldatas, "");
    }

    uint256 public proposalid_global;
    uint8 public support_global;

    function castVoteWithReason(uint256 proposalId, 
    uint8 support, string calldata reason) public virtual override returns (uint256){
        require(proposalId == proposalid_global);
        require(support == support_global);
        return super.castVoteWithReason(proposalId, support, reason);
    }
}