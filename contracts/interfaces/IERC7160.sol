// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts v4.4.1 (token/ERC721/extensions/IERC721Metadata.sol)

pragma solidity ^0.8.19;

import {IERC165} from "./IERC165.sol";

/**
 * @title IERC721MultiMetadata (EIP-7160) optional EIP-721 multi-metadata extension
 * @author 0xG
 * @author mpeyfuss
 * @dev See https://eips.ethereum.org/EIPS/eip-7160 and https://eips.ethereum.org/EIPS/eip-721
 *      Note: the ERC-165 identifier for this interface is 0x06e1bc5b.
 */
interface IERC7160 is IERC165 {
    /**
     * @dev This event emits when a token uri is pinned and is useful for indexing purposes.
     */
    event TokenUriPinned(uint256 indexed tokenId, uint256 indexed index, address indexed sender);

    /**
     * @dev This event emits when a token uri is unpinned and is useful for indexing purposes.
     */
    event TokenUriUnpinned(uint256 indexed tokenId, address indexed sender);

    /**
     * @notice Get all token uris associated with a particular token.
     * @dev If a token uri is pinned, the index returned should be the index in the string array.
     *
     * @param tokenId The identifier for the NFT.
     * @return index An unisgned integer that specifies which uri is pinned for a token (or the default uri if unpinned).
     * @return uris A string array of all uris associated with a token.
     */
    function tokenURIs(uint256 tokenId) external view returns (uint256 index, string[] memory uris);

    /**
     * @notice Pin a specific token uri for a particular token.
     *
     * @param tokenId The identifier of the NFT.
     * @param index The index in the string array returned from the `tokenURIs` function that should be pinned for the token.
     */
    function pinTokenURI(uint256 tokenId, uint256 index) external;

    /**
     * @notice Unpin metadata for a particular token.
     * @dev This should reset the token to the default uri.
     *
     * @param tokenId The identifier of the NFT.
     */
    function unpinTokenURI(uint256 tokenId) external;

    /**
     * @notice Check on-chain if a token id has a pinned uri or not.
     * @dev Useful for on-chain mechanics.
     *
     * @param tokenId The identifier of the NFT.
     * @return pinned A bool specifying if a token has metadata pinned or not.
     */
    function hasPinnedTokenURI(uint256 tokenId) external view returns (bool pinned);
}
