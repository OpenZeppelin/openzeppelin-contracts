pragma solidity ^0.4.18;

import "./BaseERC721TokenMock.sol";
import "../token/ERC721/ERC721Token.sol";

/**
 * @title ERC721TokenMock
 * This mock just provides a public mint and burn functions for testing purposes.
 */
contract ERC721TokenMock is ERC721Token, BaseERC721TokenMock {
  function ERC721TokenMock(string name, string symbol)
  BaseERC721TokenMock()
  ERC721Token(name, symbol)
  public
  { }
}
