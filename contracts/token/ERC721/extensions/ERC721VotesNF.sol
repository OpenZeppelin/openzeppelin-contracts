// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v4.6.0) (token/ERC721/extensions/draft-ERC721Votes.sol)

pragma solidity ^0.8.4;

import "../ERC721.sol";
import "../../../governance/utils/VotesNF.sol";

/**
 * @dev Extension of ERC721 to support voting and delegation as implemented by {VotesForces}, where every NFT may
 * have different voting power.
 *
 * All tokens count as votes, even if not delegated. There's no need to delegate to oneself.
 * There's an additional cost for every token transfer (more gas).
 * Token holders may cast their vote themselves or delegate their vote to a representative.
 *
 */
abstract contract ERC721VotesNF is ERC721, VotesNF {
    /**
     * @dev Calculate the voting power of each token
     * token weight exected to remain consistent and immutable.
     */
    function powerOfToken(uint256 tokenId) public pure virtual returns (uint256) {
        if (tokenId <= 1000) return tokenId * 2;
        return tokenId / 2;
    }

    /**
     * @dev Adjusts votes when tokens are transferred.
     *
     * Emits a {IVotes-DelegateVotesChanged} event.
     */
    function _afterTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal virtual override {
        _transferVotingUnits(from, to, powerOfToken(tokenId));
        super._afterTokenTransfer(from, to, tokenId);
    }

    /**
     * @dev Adjusts votes when a batch of tokens is transferred.
     *
     * Emits a {IVotes-DelegateVotesChanged} event.
     */
    function _afterConsecutiveTokenTransfer(
        address from,
        address to,
        uint256 first,
        uint96 size
    ) internal virtual override {
        for (uint256 i = 0; i < size; ++i) {
            _transferVotingUnits(from, to, powerOfToken(first + i));
        }
        super._afterConsecutiveTokenTransfer(from, to, first, size);
    }
}
