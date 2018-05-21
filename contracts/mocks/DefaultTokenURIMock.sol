pragma solidity ^0.4.23;

import "../token/ERC721/MintableERC721Token.sol";
import "../token/ERC721/DefaultTokenURI.sol";


contract DefaultTokenURIMock is DefaultTokenURI, MintableERC721Token {

  constructor(string _name, string _symbol, string _tokenURI)
    MintableERC721Token(_name, _symbol)
    DefaultTokenURI(_tokenURI)
    public
  {

  }
}
