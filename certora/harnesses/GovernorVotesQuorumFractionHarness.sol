import "../../contracts/governance/extensions/GovernorVotesQuorumFraction.sol";

contract GovernorVotesQuorumFractionHarness is GovernorVotesQuorumFraction {

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

    constructor(ERC20Votes tokenAddr, string memory name, uint256 quorumNumeratorValue) 
            GovernorVotesQuorumFraction(quorumNumeratorValue) GovernorVotes(tokenAddr) Governor(name) {}

}