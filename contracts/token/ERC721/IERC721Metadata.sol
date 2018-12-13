pragma solidity ^0.4.24;

import "./IERC721.sol";

/**
 * @title ERC-721 Non-Fungible Token Standard, optional metadata extension
 * @dev See https://github.com/ethereum/EIPs/blob/master/EIPS/eip-721.md
 */
contract IERC721Metadata is IERC721 {
    function name() external view returns (string);
    function symbol() external view returns (string);
    function tokenURI(uint256 tokenId) external view returns (string);
}
