pragma solidity ^0.4.18;

import "./ERC721TokenMock.sol";
import "../token/DetailedERC721Token.sol";

/**
 * @title DetailedERC721TokenMock
 * This mock just provides a public mint and burn functions for testing purposes.
 */
contract DetailedERC721TokenMock is ERC721TokenMock, DetailedERC721Token {
  function DetailedERC721TokenMock(string name, string symbol) DetailedERC721Token(name, symbol) public { }
}
