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
 * Adds the {_setTokenRoyalty} methods to set the token royalty information, and {_setDefaultRoyalty} method to set a default
 * royalty information.
 *
 * NOTE: As specified in EIP-2981, royalties are technically optional and payment is not enforced by this contract.
 * See https://eips.ethereum.org/EIPS/eip-2981#optional-royalty-payments[Rationale] in the EIP.
 *
 * _Available since v4.5._
 */
abstract contract ERC721Royalty is IERC721Royalty, ERC721 {
    struct RoyaltyInfo {
        address receiver;
        uint96 royaltyFraction;
    }

    RoyaltyInfo private _defaultRoyaltyInfo;
    mapping(uint256 => RoyaltyInfo) private _tokenRoyaltyInfo;

    /**
     * @dev See {IERC165-supportsInterface}.
     */
    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC721, IERC165) returns (bool) {
        return interfaceId == type(IERC721Royalty).interfaceId || super.supportsInterface(interfaceId);
    }

    /**
     * @dev Sets the royalty info for a specific token id, overriding the default royalty info.
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
        require(receiver != address(0), "ERC2981: Invalid parameters");
        require(_exists(tokenId), "ERC2981: Nonexistent token");

        _tokenRoyaltyInfo[tokenId] = RoyaltyInfo(receiver, fraction);
    }

    /**
     * @dev Sets the royalty info that tokens will default to.
     *
     * Requirements:
     * - `receiver` cannot be the zero address.
     * - `fraction` must indicate the percentage fraction. Needs to be set appropriately
     * according to the _feeDenominator granularity.
     */
    function _setDefaultRoyalty(address receiver, uint96 fraction) internal virtual {
        require(fraction <= _feeDenominator(), "ERC2981: Royalty percentage will exceed salePrice");
        require(receiver != address(0), "ERC2981: Invalid receiver");

        _defaultRoyaltyInfo = RoyaltyInfo(receiver, fraction);
    }

    /**
     * @dev See {IERC721Royalty-royaltyInfo}
     */
    function royaltyInfo(uint256 _tokenId, uint256 _salePrice) external view override returns (address, uint256) {
        RoyaltyInfo memory royalty = _tokenRoyaltyInfo[_tokenId];

        if (royalty.receiver == address(0)) {
            royalty = _defaultRoyaltyInfo;
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
     * The royalty information is cleared and the token royalty fallbacks to the default royalty.
     *
     * Requirements:
     *
     * - `tokenId` royalty information must exist.
     *
     */
    function _resetTokenRoyalty(uint256 tokenId) internal virtual {
        delete _tokenRoyaltyInfo[tokenId];
    }

    /**
     * @dev Removes default royalty information.
     *
     */
    function _deleteDefaultRoyalty() internal virtual {
        delete _defaultRoyaltyInfo;
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
        _resetTokenRoyalty(tokenId);
    }
}
