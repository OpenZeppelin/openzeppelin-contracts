pragma solidity ^0.4.24;

import "./ERC721.sol";
import "./ERC721BasicToken.sol";


/**
 * @title BurnableERC721Token
 * @author Vittorio Minacori (@vittominacori), Matt Condon (@shrugs)
 * @dev Burnable ERC721Token; owners and approve operators of a token can burn it.
 */
contract BurnableERC721Token is ERC721Burnable, ERC721BasicToken {

  bytes4 private constant InterfaceId_ERC721Burnable = 0x79cc6790;
  /*
   * 0x79cc6790 ===
   *   bytes4(keccak256('burnFrom(address,uin256)'))
   */


  constructor ()
    public
  {
    _registerInterface(InterfaceId_ERC721Burnable);
  }

  function burnFrom(address _from, uint256 _tokenId)
    canTransfer(_tokenId)
    public
  {
    _burn(_from, _tokenId);
  }
}
