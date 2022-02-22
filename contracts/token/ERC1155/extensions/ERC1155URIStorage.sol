// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts v4.4.1 (token/ERC1155/extensions/ERC1155URIStorage.sol)

pragma solidity ^0.8.0;

import "../../../utils/Strings.sol";
import "../ERC1155.sol";

/**
 * @dev ERC1155 token with storage based token URI management.
 * Inspired by the ERC721URIStorage extension
 */
abstract contract ERC1155URIStorage is ERC1155 {
    using Strings for uint256;

    // Optional mapping for token URIs
    mapping(uint256 => string) private _tokenURIs;

    /**
     * @dev See {IERC1155MetadataURI-uri}.
     *
     * This implementation returns the concatenation of the `ERC1155._uri`
     * and the token-specific uri.
     * This allowes for the following behavior:
     *
     * both `ERC1155._uri` and `ERC1155URIStorage._tokenURIs[tokenId]` are empty:
     *   → the result is empty
     * `ERC1155._uri` is not empty and `ERC1155URIStorage._tokenURIs[tokenId]` is empty:
     *   → the result is `ERC1155._uri`
     * `ERC1155._uri` is empty and `ERC1155URIStorage._tokenURIs[tokenId]` is not empty:
     *   → the result is `ERC1155URIStorage._tokenURIs[tokenId]`
     * both `ERC1155._uri` and `ERC1155URIStorage._tokenURIs[tokenId]` are not empty:
     *   → the result is the concatenation of both
     */
    function uri(uint256 tokenId) public view virtual override returns (string memory) {
        string memory _tokenURI = _tokenURIs[tokenId];
        string memory base = super.uri(tokenId);

        // If there is no base URI, return the token URI.
        if (bytes(base).length == 0) {
            return _tokenURI;
        }
        // If both are set, concatenate the base URI and tokenURI (via abi.encodePacked).
        if (bytes(_tokenURI).length > 0) {
            return string(abi.encodePacked(base, _tokenURI));
        }

        // If there is a base URI set but no tokenURI, return the base URI.
        return base;
    }

    /**
     * @dev Sets `_tokenURI` as the tokenURI of `tokenId`.
     *
     * Requirements:
     *
     * - `tokenId` must exist.
     */
    function _setTokenURI(uint256 tokenId, string memory _tokenURI) internal virtual {
        _tokenURIs[tokenId] = _tokenURI;
        emit URI(uri(tokenId), tokenId);
    }
}
