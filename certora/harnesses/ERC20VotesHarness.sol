// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../patched/token/ERC20/extensions/ERC20Votes.sol";

contract ERC20VotesHarness is ERC20Votes {
    constructor(string memory name, string memory symbol) ERC20(name, symbol) {}

    function mint(address account, uint256 amount) external {
        _mint(account, amount);
    }

    function burn(address account, uint256 amount) external {
        _burn(account, amount);
    }

    // inspection
    function ckptFromBlock(address account, uint32 pos) public view returns (uint32) {
        return checkpoints(account, pos).fromBlock;
    }

    function ckptVotes(address account, uint32 pos) public view returns (uint224) {
        return checkpoints(account, pos).votes;
    }

    function ckptFromBlockTotalSupply(uint32 pos) public view returns (uint32) {
        return checkpointsTotalSupply(pos).fromBlock;
    }

    function ckptVotesTotalSupply(uint32 pos) public view returns (uint224) {
        return checkpointsTotalSupply(pos).votes;
    }

    function maxSupply() public view returns (uint224) {
        return _maxSupply();
    }
}
