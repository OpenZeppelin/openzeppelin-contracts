// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts v4.4.0 (token/ERC721/extensions/draft-ERC721Votes.sol)

pragma solidity ^0.8.0;

import "../ERC721.sol";
import "../../../governance/utils/Votes.sol";

/**
 * @dev Extension of ERC721 to support voting and delegation, where each individual NFT counts as 1 vote.
 *
 * This extension keeps a history (checkpoints) of each account's vote power. Vote power can be delegated either
 * by calling the `delegate` function directly, or by providing a signature to be used with `delegateBySig`. Voting
 * power can be queried through the public accessors `getVotes` and `getPastVotes`.
 *
 * By default, token balance does not account for voting power. This makes transfers cheaper. The downside is that it
 * requires users to delegate to themselves in order to activate checkpoints and have their voting power tracked.
 * Enabling self-delegation can easily be done by overriding the `delegates` function. Keep in mind however that this
 * will significantly increase the base gas cost of transfers.
 *
 * _Available since v4.5._
 */
abstract contract ERC721Votes is ERC721, Votes {
    /**
     * @dev Move voting power when tokens are transferred.
     *
     * Emits a {Votes-DelegateVotesChanged} event.
     */
    function _afterTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal virtual override {
        _transferVotingAssets(from, to, 1);
        super._afterTokenTransfer(from, to, tokenId);
    }

    /**
     * @dev Returns the balance of the delegator account
     */
    function _getDelegatorVotingPower(address delegator) internal virtual override returns (uint256) {
        return balanceOf(delegator);
    }
}
