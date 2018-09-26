pragma solidity ^0.4.24;

import "./ERC721Full.sol";
import "../../access/roles/MinterRole.sol";


/**
 * @title ERC721Mintable
 * @dev ERC721 minting logic
 */
contract ERC721Mintable is ERC721Full, MinterRole {
  /**
   * @dev Function to mint tokens
   * @param to The address that will receive the minted tokens.
   * @param tokenId The token id to mint.
   * @return A boolean that indicates if the operation was successful.
   */
  function mint(
    address to,
    uint256 tokenId
  )
    public
    onlyMinter
    returns (bool)
  {
    _mint(to, tokenId);
    return true;
  }

  function mintWithTokenURI(
    address to,
    uint256 tokenId,
    string tokenURI
  )
    public
    onlyMinter
    returns (bool)
  {
    mint(to, tokenId);
    _setTokenURI(tokenId, tokenURI);
    return true;
  }
}
