pragma solidity ^0.4.24;

import "./IERC721Basic.sol";
import "./IERC721Enumerable.sol";
import "./IERC721Metadata.sol";

/**
 * @title ERC-721 Non-Fungible Token Standard, full implementation interface
 * @dev See https://github.com/ethereum/EIPs/blob/master/EIPS/eip-721.md
 */
contract IERC721 is IERC721Basic, IERC721Enumerable, IERC721Metadata {
}
