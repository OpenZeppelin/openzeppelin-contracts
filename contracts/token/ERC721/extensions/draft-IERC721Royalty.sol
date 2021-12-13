// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts v4.4.0 (token/ERC721/extensions/draft-ERC721Royalty.sol)

pragma solidity ^0.8.0;

import "../../../interfaces/IERC165.sol";

/**
 * @dev Interface for the NFT Royalty Standard.
 *
 * A standardized way to retrieve royalty payment information for non-fungible tokens (NFTs) to enable universal
 * support for royalty payments across all NFT marketplaces and ecosystem participants.
 * _Available since v4.5._
 */
interface IERC721Royalty is IERC165 {
    /**
     * @dev Called with the sale price to determine how much royalty
     * is owed and to whom.
     *
     * Requirements:
     * - `_tokenId` must be already mined, and have its royalty info set
     * - `_salePrice` cannot be the zero.
     *
     */
    function royaltyInfo(uint256 _tokenId, uint256 _salePrice)
        external
        view
        returns (address receiver, uint256 royaltyFraction);
}
