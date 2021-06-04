// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./ERC20Votes.sol";

/**
 * @dev Extension of the ERC20 token contract to support Compound's voting and delegation.
 *
 * This extensions keeps a history (checkpoints) of each account's vote power. Vote power can be delegated either
 * by calling the {delegate} function directly, or by providing a signature to be used with {delegateBySig}. Voting
 * power can be queried through the public accessors {getCurrentVotes} and {getPriorVotes}.
 *
 * By default, token balance does not account for voting power. This makes transfers cheaper. The downside is that it
 * requires users to delegate to themselves in order to activate checkpoints and have their voting power tracked.
 * Enabling self-delegation can easily be done by overriding the {delegates} function. Keep in mind however that this
 * will significantly increase the base gas cost of transfers.
 *
 * _Available since v4.2._
 */
abstract contract ERC20VotesComp is ERC20Votes {
    /**
     * @dev TODO.
     */
    function getCurrentVotes(address account) external view returns (uint96) {
        return SafeCast.toUint96(getVotes(account));
    }
    /**
     * @dev TODO.
     */
    function getPriorVotes(address account, uint256 blockNumber) external view returns (uint96) {
        return SafeCast.toUint96(getPastVotes(account, blockNumber));
    }

    /**
     * @dev Maximum supported values.
     */
    function _maxVotes() internal view virtual override returns (uint256) {
        return type(uint96).max;
    }
}
