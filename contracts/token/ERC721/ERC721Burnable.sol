pragma solidity ^0.4.24;

import "./ERC721.sol";

contract ERC721Burnable is ERC721 {
  function burn(uint256 tokenId)
    public
  {
    require(_isApprovedOrOwner(msg.sender, tokenId));
    _burn(ownerOf(tokenId), tokenId);
  }
}
