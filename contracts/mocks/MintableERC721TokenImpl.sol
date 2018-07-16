pragma solidity ^0.4.24;

import "../token/ERC721/ERC721Token.sol";
import "../token/ERC721/MintableERC721Token.sol";


contract MintableERC721TokenImpl is ERC721Token, MintableERC721Token {
  constructor(string name, string symbol)
    ERC721Token(name, symbol)
    public
  {
  }
}
