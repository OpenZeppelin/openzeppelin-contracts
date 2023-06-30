// SPDX-License-Identifier: MIT

pragma solidity ^0.8.19;

import {ERC20Votes} from "../token/ERC20/extensions/ERC20Votes.sol";

abstract contract ERC20VotesQuadratic is ERC20Votes {
    /**
     * @dev Returns the balance of `account`.
     */
    function _getVotingUnits(address account) internal view virtual override returns (uint256) {
        uint256 balance = balanceOf(account);
        return balance * balance;
    }

    /**
     * @dev Converts an `amount` of tokens into voting units.
     */
    function _toVotingUnits(uint256 amount) internal view virtual override returns (uint256) {
        return amount * amount;
    }
}
