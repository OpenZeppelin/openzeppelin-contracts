// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v5.1.0) (token/ERC721/extensions/ERC721Votes.sol)

pragma solidity ^0.8.20;

import {ERC721} from "../ERC721.sol";
import {Votes} from "../../../governance/utils/Votes.sol";

/**
 * @dev Extension of ERC-721 to support voting and delegation as implemented by {Votes}, where each individual NFT counts
 * as 1 vote unit.
 *
 * Tokens do not count as votes until they are delegated, because votes must be tracked which incurs an additional cost
 * on every transfer. Token holders can either delegate to a trusted representative who will decide how to make use of
 * the votes in governance decisions, or they can delegate to themselves to be their own representative.
 */
abstract contract ERC721Votes is ERC721, Votes {
    /**
     * @dev See {ERC721-_update}. Adjusts votes when tokens are transferred.
     *
     * Emits a {IVotes-DelegateVotesChanged} event.
     */
    function _update(address to, uint256 tokenId, address auth) internal virtual override returns (address) {
        address previousOwner = super._update(to, tokenId, auth);

        _transferVotingUnits(previousOwner, to, 1);

        return previousOwner;
    }

    /**
     * @dev Returns the balance of `account`.
     *
     * WARNING: Overriding this function will likely result in incorrect vote tracking.
     */
    function _getVotingUnits(address account) internal view virtual override returns (uint256) {
        return balanceOf(account);
    }

    /**
     * @dev See {ERC721-_increaseBalance}. We need that to account tokens that were minted in batch.
     */
    function _increaseBalance(address account, uint128 amount) internal virtual override {
        super._increaseBalance(account, amount);
        _transferVotingUnits(address(0), account, amount);
    }
}
