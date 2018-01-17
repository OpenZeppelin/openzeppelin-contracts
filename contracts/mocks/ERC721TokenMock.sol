pragma solidity ^0.4.18;

import "../token/ERC721Token.sol";

/**
 * @title ERC721TokenMock
 * This mock just provides a public mint and burn functions for testing purposes.
 */
contract ERC721TokenMock is ERC721Token {
  function ERC721TokenMock() ERC721Token() public { }

  function publicMint(address _to, uint256 _tokenId) public {
    super.mint(_to, _tokenId);
  }

  function publicBurn(uint256 _tokenId) public {
    super.burn(_tokenId);
  }
}
