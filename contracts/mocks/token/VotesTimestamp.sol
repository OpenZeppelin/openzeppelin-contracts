// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../../token/ERC20/extensions/ERC20Votes.sol";
import "../../token/ERC20/extensions/ERC20VotesComp.sol";
import "../../token/ERC721/extensions/ERC721Votes.sol";

abstract contract ERC20VotesTimestampMock is ERC20Votes {
    function clock() public view override returns (uint256) {
        return block.timestamp;
    }
}

abstract contract ERC20VotesCompTimestampMock is ERC20VotesComp {
    function clock() public view override returns (uint256) {
        return block.timestamp;
    }
}

abstract contract ERC721VotesTimestampMock is ERC721Votes {
    function clock() public view override returns (uint256) {
        return block.timestamp;
    }
}