// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../IGovernor.sol";
import "../../token/ERC20/extensions/ERC20VotesComp.sol";

/**
 * @dev Extension of {Governor} for voting weight extraction from a Comp or {ERC20Votes} token.
 *
 * _Available since v4.2._
 */
abstract contract GovernorWithERC20VotesComp is IGovernor {
    ERC20VotesComp public immutable token;

    constructor(address token_) {
        token = ERC20VotesComp(token_);
    }

    /**
     * Read the voting weight from the token's built in snapshot mechanism (see {IGovernor-getVotes}).
     */
    function getVotes(address account, uint256 blockNumber) public view virtual override returns (uint256) {
        return token.getPriorVotes(account, blockNumber);
    }
}
