pragma solidity ^0.4.24;

import "../../Initializable.sol";
import "./ERC721.sol";


contract ERC721Burnable is Initializable, ERC721 {
  function initialize() public initializer {
    ERC721.initialize();
  }

  function burn(uint256 tokenId)
    public
  {
    require(_isApprovedOrOwner(msg.sender, tokenId));
    _burn(ownerOf(tokenId), tokenId);
  }
}
