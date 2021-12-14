// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts v4.4.0 (token/ERC721/extensions/draft-ERC721Royalty.sol)

pragma solidity ^0.8.0;

import "../ERC721.sol";
import "./draft-IERC721Royalty.sol";
import "../../../utils/introspection/ERC165.sol";

/**
 * @dev Implementation of the ERC721 Royalty extension allowing royalty information to be stored and retrieved, as defined in
 * https://eips.ethereum.org/EIPS/eip-2981[EIP-2981].
 *
 * Adds the {_setTokenRoyalty} methods to set the token royalty information, and {_setGlobalRoyalty} method to set a global
 * royalty information.
 *
 * _Available since v4.5._
 */
abstract contract ERC721Royalty is IERC721Royalty, ERC721 {
    struct RoyaltyInfo {
        address receiver;
        uint96 royaltyFraction;
    }

    RoyaltyInfo private _globalRoyaltyInfo;
    mapping(uint256 => RoyaltyInfo) private _tokenRoyaltyInfo;

    /**
     * @dev See {IERC165-supportsInterface}.
     */
    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC721, IERC165) returns (bool) {
        return interfaceId == type(IERC721Royalty).interfaceId || super.supportsInterface(interfaceId);
    }

    /**
     * @dev Sets tokens royalties
     *
     * Requirements:
     * - `tokenId` must be already mined.
     * - `receiver` cannot be the zero address.
     * - `fraction` must indicate the percentage fraction using two decimals.
     */
    function _setTokenRoyalty(
        uint256 tokenId,
        address receiver,
        uint96 fraction
    ) internal virtual {
        require(fraction <= _feeDenominator(), "ERC2981: Royalty percentage will exceed salePrice");
        require(receiver != address(0), "ERC2981: Invalid receiver");
        require(_exists(tokenId), "ERC2981: Nonexistent token");

        _tokenRoyaltyInfo[tokenId] = RoyaltyInfo(receiver, fraction);
    }

    /**
     *
     * @dev Sets global royalty
     *
     * Requirements:
     * - `receiver` cannot be the zero address.
     * - `fraction` must indicate the percentage fraction. Needs to be set appropriately
     * according to the _feeDenominator granularity.
     */
    function _setGlobalRoyalty(address receiver, uint96 fraction) internal virtual {
        require(fraction <= _feeDenominator(), "ERC2981: Royalty percentage will exceed salePrice");
        require(receiver != address(0), "ERC2981: Invalid receiver");

        _globalRoyaltyInfo = RoyaltyInfo(receiver, fraction);
    }

    /**
     * @dev See {IERC721Royalty-royaltyInfo}
     */
    function royaltyInfo(uint256 _tokenId, uint256 _salePrice) external view override returns (address, uint256) {
        RoyaltyInfo memory royalty = _tokenRoyaltyInfo[_tokenId];
        if (royalty.receiver == address(0)) {
            royalty = _globalRoyaltyInfo;
        }

        uint256 royaltyAmount = (_salePrice * royalty.royaltyFraction) / _feeDenominator();

        return (royalty.receiver, royaltyAmount);
    }

    /**
     * @dev Returns the percentage granularity being used. The default denominator is 10000
     *  but it can be customized by an override.
     */
    function _feeDenominator() internal pure virtual returns (uint96) {
        return 10000;
    }

    /**
     * @dev Removes `tokenId` royalty information.
     * The royalty information is cleared when the token is burned.
     *
     * Requirements:
     *
     * - `tokenId` royalty information must exist.
     *
     */
    function _deleteTokenRoyalty(uint256 tokenId) internal virtual {
        delete _tokenRoyaltyInfo[tokenId];
    }

    /**
     * @dev Removes global royalty information.
     *
     */
    function _deleteRoyalty() internal virtual {
        delete _globalRoyaltyInfo;
    }

    /**
     * @dev Destroys `tokenId`.
     * The royalty information is cleared when the token is burned.
     *
     * Requirements:
     *
     * - `tokenId` must exist.
     *
     * Emits a {Transfer} event.
     */
    function _burn(uint256 tokenId) internal virtual override {
        super._burn(tokenId);
        _deleteTokenRoyalty(tokenId);
    }
}
