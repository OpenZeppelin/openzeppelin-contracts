// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../../token/ERC20/extensions/ERC20Votes.sol";

abstract contract ERC20VotesTimestampMock is ERC20Votes {
    function clock() public view override returns (uint256) {
        return block.timestamp;
    }
}
