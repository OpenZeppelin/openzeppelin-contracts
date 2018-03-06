pragma solidity ^0.4.18;

import "../token/ERC721/BaseERC721Token.sol";

/**
 * @title BaseERC721TokenMock
 * This mock just provides a public mint and burn functions for testing purposes.
 */
contract BaseERC721TokenMock is BaseERC721Token {
  function BaseERC721TokenMock() BaseERC721Token() public { }

  function mint(address _to, uint256 _tokenId) public {
    super._mint(_to, _tokenId);
  }

  function burn(uint256 _tokenId) public {
    super._burn(_tokenId);
  }
}
