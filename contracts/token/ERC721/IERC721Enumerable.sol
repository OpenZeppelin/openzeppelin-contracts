pragma solidity ^0.6.2;

import "./IERC721.sol";

/**
 * @title ERC-721 Non-Fungible Token Standard, optional enumeration extension
 * @dev See https://eips.ethereum.org/EIPS/eip-721
 */
interface IERC721Enumerable is IERC721 {

    /**
     * @dev Gets the total amount of NFT stored by the contract.
     */
    function totalSupply() external view returns (uint256);

    /**
     * @dev Gets a token ID owned by an account (`owner`) at a given index (`index`) of its token list.
     */
    function tokenOfOwnerByIndex(address owner, uint256 index) external view returns (uint256 tokenId);

    /**
     * @dev Gets a token ID at a given index (`index`) of all the NFT of the tokens stored by the contract.
     */
    function tokenByIndex(uint256 index) external view returns (uint256);
}
