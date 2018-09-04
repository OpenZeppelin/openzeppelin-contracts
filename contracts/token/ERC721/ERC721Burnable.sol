pragma solidity ^0.4.24;

import "./ERC721.sol";


contract ERC721Burnable is ERC721 {
  function burn(uint256 _tokenId)
    public
  {
    require(_isApprovedOrOwner(msg.sender, _tokenId));
    _burn(ownerOf(_tokenId), _tokenId);
  }
}
