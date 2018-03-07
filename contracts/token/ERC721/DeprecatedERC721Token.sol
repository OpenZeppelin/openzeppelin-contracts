pragma solidity ^0.4.18;

import "./DeprecatedERC721.sol";
import "./ERC721Token.sol";

contract DeprecatedERC721Token is DeprecatedERC721, ERC721Token {
  /**
  * @dev Claims the ownership of a given token ID
  * @param _tokenId uint256 ID of the token being claimed by the msg.sender
  */
  function takeOwnership(uint256 _tokenId) canTransfer(_tokenId) public {
    require(msg.sender != ownerOf(_tokenId));
    clearApprovalAndTransfer(ownerOf(_tokenId), msg.sender, _tokenId, "", false);
  }

  /**
  * @dev Transfers the ownership of a given token ID to another address
  * @param _to address to receive the ownership of the given token ID
  * @param _tokenId uint256 ID of the token to be transferred
  */
  function transfer(address _to, uint256 _tokenId) public {
    address owner = ownerOf(_tokenId);
    require(owner == msg.sender);
    clearApprovalAndTransfer(owner, _to, _tokenId, "", false);
  }

  /**
  * @dev Gets the list of tokens owned by a given address
  * @param _owner address to query the tokens of
  * @return uint256[] representing the list of tokens owned by the passed address
  */
  function tokensOf(address _owner) public view returns (uint256[]) {
    return ownedTokens[_owner];
  }
}