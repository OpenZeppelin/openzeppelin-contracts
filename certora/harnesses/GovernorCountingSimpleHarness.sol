import "../../contracts/governance/extensions/GovernorCountingSimple.sol";

contract GovernorCountingSimpleHarness is GovernorCountingSimple {

    mapping(uint256 => uint256) _quorum;

    function quorum(uint256 blockNumber) public view override virtual returns (uint256) {
        return _quorum[blockNumber];
    }

    mapping (address => mapping (uint256 => uint256)) _getVotes;

    function getVotes(address account, uint256 blockNumber) public view override virtual returns (uint256) {
        return _getVotes[account][blockNumber];
    }

    uint256 _votingDelay;
    function votingDelay() public view override virtual returns (uint256) {
        return _votingDelay;
    }

    uint256 _votingPeriod;
    function votingPeriod() public view override virtual returns (uint256) {
        return _votingPeriod;
    }

    constructor(string memory name) Governor(name) {}

}