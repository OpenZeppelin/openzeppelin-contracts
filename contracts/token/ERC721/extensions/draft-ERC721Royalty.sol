// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts v4.4.0 (token/ERC721/extensions/draft-ERC721Royalty.sol)

pragma solidity ^0.8.0;

import "./draft-IERC721Royalty.sol";
import "../../../utils/introspection/ERC165Storage.sol";
import "hardhat/console.sol";

/**
 * @dev Implementation of the ERC721 Royalty extension allowing royalty information to be stored and retrieved, as defined in
 * https://eips.ethereum.org/EIPS/eip-2981[EIP-2981].
 *
 * Adds the {_setTokenRoyalty} methods to set the token royalty information, and {_setGlobalRoyalty} method to set a global
 * royalty information.
 *
 * _Available since v4.5._
 */
abstract contract ERC721Royalty is IERC721Royalty, ERC165Storage {
    struct RoyaltyInfo {
        address receiver;
        uint256 royaltyAmount;
    }

    RoyaltyInfo private _royaltyInfo;
    mapping(uint256 => RoyaltyInfo) private _tokenRoyalty;

    /*
     * @dev Sets tokens royalties
     *
     * Requirements:
     * - `tokenId` must be already mined.
     * - `recipient` cannot be the zero address.
     * - `value` must indicate the percentage value using two decimals.
     */
    function _setTokenRoyalty(
        uint256 tokenId,
        address recipient,
        uint256 value
    ) internal virtual {
        require(value < 100, "ERC2981: Royalty percentage is too high");
        require(recipient != address(0), "ERC2981: Invalid recipient");

        _tokenRoyalty[tokenId] = RoyaltyInfo(recipient, value);
    }

    /*
     *
     * @dev Sets global royalty
     *
     * Requirements:
     * - `recipient` cannot be the zero address.
     * - `value` must indicate the percentage value.
     */
    function _setGlobalRoyalty(address recipient, uint256 value) internal virtual {
        require(value < 100, "ERC2981: Royalty percentage is too high");
        require(recipient != address(0), "ERC2981: Invalid recipient");

        _royaltyInfo = RoyaltyInfo(recipient, value);
    }

    /**
     * @dev See {IERC721Royalty-royaltyInfo}
     */
    function royaltyInfo(uint256 _tokenId, uint256 _salePrice)
        external
        view
        override
        returns (address receiver, uint256 royaltyAmount)
    {
        if (_tokenRoyalty[_tokenId].receiver != address(0)) {
            RoyaltyInfo memory royalty = _tokenRoyalty[_tokenId];
            receiver = royalty.receiver;
            royaltyAmount = (_salePrice * royalty.royaltyAmount) / 100;
        } else {
            receiver = _royaltyInfo.receiver;
            royaltyAmount = (_salePrice * _royaltyInfo.royaltyAmount) / 100;
        }
    }
}
