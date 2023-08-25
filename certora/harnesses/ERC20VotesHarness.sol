// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import {ERC20Votes, ERC20} from "../patched/token/ERC20/extensions/ERC20Votes.sol";
import {EIP712} from "../patched/utils/cryptography/EIP712.sol";

contract ERC20VotesHarness is ERC20Votes {
    constructor(string memory name, string memory symbol) ERC20(name, symbol) EIP712(name, "1") {}

    function mint(address account, uint256 amount) external {
        _mint(account, amount);
    }

    function burn(address account, uint256 amount) external {
        _burn(account, amount);
    }

    // inspection
    function ckptClock(address account, uint32 pos) public view returns (uint32) {
        return checkpoints(account, pos)._key;
    }

    function ckptVotes(address account, uint32 pos) public view returns (uint224) {
        return checkpoints(account, pos)._value;
    }

    function numCheckpointsTotalSupply() public view returns (uint32) {
        return _numCheckpointsTotalSupply();
    }

    function ckptClockTotalSupply(uint32 pos) public view returns (uint32) {
        return _checkpointsTotalSupply(pos)._key;
    }

    function ckptVotesTotalSupply(uint32 pos) public view returns (uint224) {
        return _checkpointsTotalSupply(pos)._value;
    }

    function maxSupply() public view returns (uint224) {
        return _maxSupply();
    }
}
