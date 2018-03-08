pragma solidity ^0.4.18;

import "./ERC721TokenMock.sol";
import "../token/ERC721/ERC721TokenMetadata.sol";

/**
 * @title ERC721TokenMetadataMock
 * This mock just provides a public mint and burn functions for testing purposes.
 */
contract ERC721TokenMetadataMock is ERC721TokenMetadata, ERC721TokenMock {
  function ERC721TokenMetadataMock(string name, string symbol)
  ERC721TokenMock(name, symbol)
  ERC721TokenMetadata(name, symbol)
  public
  { }
}
