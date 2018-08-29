pragma solidity ^0.4.24;

import "./ERC721Basic.sol";
import "../../lifecycle/Pausable.sol";


/**
 * @title ERC721 Non-Fungible Pausable token
 * @dev ERC721Basic modified with pausable transfers.
 **/
contract ERC721Pausable is ERC721Basic, Pausable {
  function approve(
    address _to,
    uint256 _tokenId
  )
    public
    whenNotPaused
  {
    super.approve(_to, _tokenId);
  }

  function setApprovalForAll(
    address _to,
    bool _approved
  )
    public
    whenNotPaused
  {
    super.setApprovalForAll(_to, _approved);
  }

  function transferFrom(
    address _from,
    address _to,
    uint256 _tokenId
  )
    public
    whenNotPaused
  {
    super.transferFrom(_from, _to, _tokenId);
  }
}
