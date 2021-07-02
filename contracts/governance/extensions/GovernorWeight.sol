// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../Governor.sol";
import "../../token/ERC20/extensions/ERC20Votes.sol";
import "../../utils/math/Math.sol";

/**
 * @dev Extension of {Governor} for voting weight extraction from an {ERC20Votes} token.
 *
 * _Available since v4.3._
 */
abstract contract GovernorWeight is Governor {
    ERC20Votes public immutable token;

    constructor(address tokenAddress) {
        token = ERC20Votes(tokenAddress);
    }

    /**
     * Read the voting weight from the token's built in snapshot mechanism (see {IGovernor-getVotes}).
     */
    function getVotes(address account, uint256 blockNumber) public view virtual override returns (uint256) {
        return token.getPastVotes(account, blockNumber);
    }
}
