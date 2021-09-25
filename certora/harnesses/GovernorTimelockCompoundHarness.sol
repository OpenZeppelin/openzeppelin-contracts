import "../../contracts/governance/extensions/GovernorTimelockCompound.sol";

contract GovernorTimelockCompoundHarness is GovernorTimelockCompound {

    mapping(uint256 => uint256) _quorum;

    function quorum(uint256 blockNumber) public view override virtual returns (uint256) {
        return _quorum[blockNumber];
    }

    mapping (address => mapping (uint256 => uint256)) _getVotes;

    function getVotes(address account, uint256 blockNumber) public view override virtual returns (uint256) {
        return _getVotes[account][blockNumber];
    }

    mapping (uint256 => bool) __quoromReached;
    function _quorumReached(uint256 proposalId) internal view override virtual returns (bool) {
        return __quoromReached[proposalId];
    }

    mapping (uint256 => bool) __voteSucceeded;
    function _voteSucceeded(uint256 proposalId) internal view override virtual returns (bool) {
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

    constructor(string memory name, ICompoundTimelock timelock) Governor(name) GovernorTimelockCompound(timelock) {}

}