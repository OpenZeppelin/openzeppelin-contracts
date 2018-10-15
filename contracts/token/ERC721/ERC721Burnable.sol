pragma solidity ^0.4.24;

import "zos-lib/contracts/Initializable.sol";
import "./ERC721.sol";


contract ERC721Burnable is Initializable, ERC721 {
  function burn(uint256 tokenId)
    public
  {
    require(_isApprovedOrOwner(msg.sender, tokenId));
    _burn(ownerOf(tokenId), tokenId);
  }

  uint256[50] private ______gap;
}
