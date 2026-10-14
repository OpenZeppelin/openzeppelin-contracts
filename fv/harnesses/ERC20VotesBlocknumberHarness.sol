// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "../patched/token/ERC20/ERC20.sol";
import {ERC20Votes} from "../patched/token/ERC20/extensions/ERC20Votes.sol";
import {EIP712} from "../patched/utils/cryptography/EIP712.sol";

contract ERC20VotesBlocknumberHarness is ERC20Votes {
    constructor(string memory name, string memory symbol) ERC20(name, symbol) EIP712(name, "1") {}

    function mint(address account, uint256 amount) external {
        _mint(account, amount);
    }

    function burn(address account, uint256 amount) external {
        _burn(account, amount);
    }

    // inspection
    function ckptFromBlock(address account, uint32 pos) public view returns (uint48) {
        return checkpoints(account, pos)._key;
    }

    function ckptVotes(address account, uint32 pos) public view returns (uint208) {
        return checkpoints(account, pos)._value;
    }

    function maxSupply() public view returns (uint256) {
        return _maxSupply();
    }
}
