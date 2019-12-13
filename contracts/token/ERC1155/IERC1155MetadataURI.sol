pragma solidity ^0.5.0;

import "./IERC1155.sol";

/**
 * @title ERC-1155 Multi Token Standard basic interface, optional metadata URI extension
 * @dev See https://eips.ethereum.org/EIPS/eip-1155
 */
contract IERC1155MetadataURI is IERC1155 {
    function uri(uint256 id) external view returns (string memory);
}
