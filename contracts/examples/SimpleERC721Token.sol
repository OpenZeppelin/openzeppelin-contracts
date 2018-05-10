pragma solidity ^0.4.23;

import "../token/ERC721/ERC721Token.sol";
import "../token/ERC721/MintableERC721Token.sol";
import "../token/ERC721/BurnableERC721Token.sol";


contract SimpleERC721Token is ERC721Token, BurnableERC721Token {
  constructor(string name, string symbol)
    ERC721Token(name, symbol)
    public
  {
  }

  // no access control, anyone can mint
  function mint(address _to, uint256 _tokenId) public {
    super._mint(_to, _tokenId);
  }


  // no access control, anyone can set token uri
  function setTokenURI(uint256 _tokenId, string _uri) public {
    super._setTokenURI(_tokenId, _uri);
  }
}
