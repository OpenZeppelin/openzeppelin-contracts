pragma solidity ^0.4.23;

import "../token/ERC721/ERC721Token.sol";
import "../token/ERC721/MintableERC721Token.sol";
import "../token/ERC721/BurnableERC721Token.sol";


// solium-disable-next-line max-len
contract SimpleERC721Token is ERC721Token, MintableERC721Token, BurnableERC721Token {
  constructor(string name, string symbol) public
  ERC721Token(name, symbol)
  { }

  function setTokenURI(uint256 _tokenId, string _uri) public {
    super._setTokenURI(_tokenId, _uri);
  }
}
