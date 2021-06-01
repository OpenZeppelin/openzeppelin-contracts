// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../IGovernor.sol";
import "../../token/ERC20/extensions/IERC20Votes.sol";

/**
 * @dev Extension of {Governor} for voting weight extraction from a Comp or {ERC20Votes} token.
 *
 * _Available since v4.2._
 */
abstract contract GovernorWithToken is IGovernor {
    IERC20Votes immutable public token;

    constructor(IERC20Votes token_) {
        token = token_;
    }

    /**
     * Read the voting weight from the token's built in snapshot mechanism (see {IGovernor-getVotes}).
     */
    function getVotes(address account, uint256 blockNumber) public view virtual override returns(uint256) {
        return token.getPriorVotes(account, blockNumber);
    }
}
