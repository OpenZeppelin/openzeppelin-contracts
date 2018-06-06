pragma solidity ^0.4.23;

import "./ERC721BasicToken.sol";


/**
 * @title BurnableERC721Token
 * @author Vittorio Minacori (@vittominacori)
 * @dev Simple ERC721 Token, with burnable function
 */
contract BurnableERC721Token is ERC721BasicToken {
  /**
   * @dev Only token owner can burn his token
   */
  function burn(uint256 _tokenId) public {
    super._burn(msg.sender, _tokenId);
  }
}
