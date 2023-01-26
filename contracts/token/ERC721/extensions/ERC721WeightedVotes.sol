// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v4.8.0) (token/ERC721/extensions/ERC721Votes.sol)

pragma solidity ^0.8.0;

import "../ERC721.sol";
import "../../../governance/utils/Votes.sol";
import "./IERC721Supply.sol";

/**
 * @dev Extension of ERC721 to support voting and delegation as implemented by {Votes}, where each individual NFT counts
 * as 1 vote unit.
 *
 * Tokens do not count as votes until they are delegated, because votes must be tracked which incurs an additional cost
 * on every transfer. Token holders can either delegate to a trusted representative who will decide how to make use of
 * the votes in governance decisions, or they can delegate to themselves to be their own representative.
 *
 * _Available since v4.5._
 */
abstract contract ERC721WeightedVotes is ERC721, Votes, IERC721Supply {

    function totalSupply() public view virtual override returns (uint256);
    function _votesPerToken() internal pure virtual returns (uint256) { return 1; }
    /**
     * @dev See {ERC721-_afterTokenTransfer}. Adjusts votes when tokens are transferred.
     *
     * Emits a {IVotes-DelegateVotesChanged} event.
     */
    function _afterTokenTransfer(
        address from,
        address to,
        uint256 firstTokenId,
        uint256 batchSize
    ) internal virtual override {
        _transferVotingUnits(from, to, _getVotesForToken(firstTokenId, batchSize));
        super._afterTokenTransfer(from, to, firstTokenId, batchSize);
    }

    /**
     * @dev Returns the balance of `account`.
     */
    function _getVotingUnits(address account) internal view virtual override returns (uint256) {
        return balanceOf(account) * _votesPerToken();
    }

    /**
     * @dev Returns the vote amounts sequential token batches enumerating from the first token
     */
    function _getVotesForToken(uint256 firstTokenId, uint256 batchSize) internal view virtual returns (uint256) {
       return batchSize * _votesPerToken();
    }

    function _mint(address to, uint256 tokenId) internal override virtual {
        require((totalSupply() + 1) * _votesPerToken() <= 2**256 -1, "ERC721Votes: voting power exceeds max uint256");
        super._mint(to, tokenId);
    }
}
