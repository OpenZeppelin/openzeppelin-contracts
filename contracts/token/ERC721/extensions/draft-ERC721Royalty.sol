// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts v4.4.0 (token/ERC721/extensions/draft-ERC721Royalty.sol)

pragma solidity ^0.8.0;

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
abstract contract ERC721Royalty is ERC165, IERC721Royalty {
    struct RoyaltyInfo {
        address receiver;
        uint256 royaltyFraction;
    }

    RoyaltyInfo private _globalRoyaltyInfo;
    mapping(uint256 => RoyaltyInfo) private _tokenRoyaltyInfo;

    /*
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
        uint256 fraction
    ) internal virtual {
        require(fraction < 100, "ERC2981: Royalty percentage is too high");
        require(receiver != address(0), "ERC2981: Invalid receiver");

        _tokenRoyaltyInfo[tokenId] = RoyaltyInfo(receiver, fraction);
    }

    /*
     *
     * @dev Sets global royalty
     *
     * Requirements:
     * - `receiver` cannot be the zero address.
     * - `fraction` must indicate the percentage fraction.
     */
    function _setGlobalRoyalty(address receiver, uint256 fraction) internal virtual {
        require(fraction < 100, "ERC2981: Royalty percentage is too high");
        require(receiver != address(0), "ERC2981: Invalid receiver");

        _globalRoyaltyInfo = RoyaltyInfo(receiver, fraction);
    }

    /**
     * @dev See {IERC721Royalty-royaltyInfo}
     */
    function royaltyInfo(uint256 _tokenId, uint256 _salePrice)
        external
        view
        override
        returns (address receiver, uint256 royaltyFraction)
    {
        if (_tokenRoyaltyInfo[_tokenId].receiver != address(0)) {
            RoyaltyInfo memory royalty = _tokenRoyaltyInfo[_tokenId];
            receiver = royalty.receiver;
            royaltyFraction = (_salePrice * royalty.royaltyFraction) / 100;
        } else {
            receiver = _globalRoyaltyInfo.receiver;
            royaltyFraction = (_salePrice * _globalRoyaltyInfo.royaltyFraction) / 100;
        }
    }

    /**
     * @dev See {IERC165-supportsInterface}.
     */
    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC165, IERC165) returns (bool) {
        return
            interfaceId == type(IERC721Royalty).interfaceId ||
            super.supportsInterface(interfaceId);
    }
}
