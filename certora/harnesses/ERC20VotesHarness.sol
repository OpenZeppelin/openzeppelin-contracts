import "../munged/token/ERC20/extensions/ERC20Votes.sol";

contract ERC20VotesHarness is ERC20Votes {
    constructor(string memory name, string memory symbol) ERC20Permit(name) ERC20(name, symbol) {}

    function ckptFromBlock(address account, uint32 pos) public view returns (uint32) {
        return _checkpoints[account][pos].fromBlock;
    }
    
    function ckptVotes(address account, uint32 pos) public view returns (uint224) {
        return _checkpoints[account][pos].fromBlock;
    }

    function mint(address account, uint256 amount) public {
        _mint(account, amount);
    }

    function burn(address account, uint256 amount) public {
        _burn(account, amount);
    }

    function unsafeNumCheckpoints(address account) public view returns (uint256) {
        return _checkpoints[account].length;
    }

    function delegateBySig(
        address delegatee,
        uint256 nonce,
        uint256 expiry,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) public virtual override { }

}

