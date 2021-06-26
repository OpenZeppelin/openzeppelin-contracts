// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../../token/ERC20/extensions/ERC20Votes.sol";

/**
 * @dev Extension of {Governor} for voting weight extraction from a Comp or {ERC20Votes} token.
 *
 * _Available since v4.3._
 */
abstract contract GovernorWithERC20Votes {
    ERC20Votes public immutable token;

    constructor(address token_) {
        token = ERC20Votes(token_);
    }

    /**
     * Read the voting weight from the token's built in snapshot mechanism (see {IGovernor-getVotes}).
     */
    function getVotes(address account, uint256 blockNumber) public view virtual returns (uint256) {
        return token.getPastVotes(account, blockNumber);
    }
}
