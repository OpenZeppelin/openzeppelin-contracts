pragma solidity ^0.4.23;

import "./ERC721Token.sol";


/**
 * @title BurnableERC721Token
 * @author Vittorio Minacori (@vittominacori)
 * @dev Simple ERC721 Token, with burnable function
 */
contract BurnableERC721Token is ERC721Token {
  constructor(string _name, string _symbol) public
  ERC721Token(_name, _symbol)
  { }

  /**
   * @dev Only token owner can burn his token
   */
  function burn(uint256 _tokenId) public {
    super._burn(msg.sender, _tokenId);
  }
}
