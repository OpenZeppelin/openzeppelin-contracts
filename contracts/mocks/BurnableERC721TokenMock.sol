pragma solidity ^0.4.23;

import "../token/ERC721/BurnableERC721Token.sol";


/**
 * @title BurnableERC721TokenMock
 * This mock just provides a public setter for metadata URI
 */
contract BurnableERC721TokenMock is BurnableERC721Token {
  function mint(address _to, uint256 _tokenId) public {
    super._mint(_to, _tokenId);
  }
}
