pragma solidity ^0.6.0;

import "./IERC721.sol";
import "./IERC721Enumerable.sol";
import "./IERC721Metadata.sol";

/**
 * @title ERC-721 Non-Fungible Token Standard, full implementation interface
 * @dev See https://eips.ethereum.org/EIPS/eip-721
 */
abstract contract IERC721Full is IERC721, IERC721Enumerable, IERC721Metadata { }
