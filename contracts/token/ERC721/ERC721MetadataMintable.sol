pragma solidity ^0.4.24;

import "zos-lib/contracts/Initializable.sol";
import "./ERC721Metadata.sol";
import "../../access/roles/MinterRole.sol";


/**
 * @title ERC721MetadataMintable
 * @dev ERC721 minting logic with metadata
 */
contract ERC721MetadataMintable is Initializable, ERC721, ERC721Metadata, MinterRole {
  function initialize(address sender) public initializer {
    require(ERC721._hasBeenInitialized());
    require(ERC721Metadata._hasBeenInitialized());
    MinterRole.initialize(sender);
  }

  /**
   * @dev Function to mint tokens
   * @param to The address that will receive the minted tokens.
   * @param tokenId The token id to mint.
   * @param tokenURI The token URI of the minted token.
   * @return A boolean that indicates if the operation was successful.
   */
  function mintWithTokenURI(
    address to,
    uint256 tokenId,
    string tokenURI
  )
    public
    onlyMinter
    returns (bool)
  {
    _mint(to, tokenId);
    _setTokenURI(tokenId, tokenURI);
    return true;
  }

  uint256[50] private ______gap;
}
