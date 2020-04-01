pragma solidity ^0.6.2;

import "./IERC721.sol";

/**
 * @title ERC-721 Non-Fungible Token Standard, optional metadata extension
 * @dev See https://eips.ethereum.org/EIPS/eip-721
 */
interface IERC721Metadata is IERC721 {

    /**
     * @dev Gets the NFT name.
     */
    function name() external view returns (string memory);

    /**
     * @dev Gets the NFT symbol.
     */
    function symbol() external view returns (string memory);

    /**
     * @dev Gets the Uniform Resource Identifier (URI) for a given NFT (`tokenId`).
     */
    function tokenURI(uint256 tokenId) external view returns (string memory);
}
