pragma solidity ^0.4.24;

import "./ERC721.sol";
import "../../access/rbac/MinterRole.sol";


/**
 * @title ERC721Mintable
 * @dev ERC721 minting logic
 */
contract ERC721Mintable is ERC721, MinterRole {
  event Minted(address indexed to, uint256 tokenId);
  event MintingFinished();

  bool public mintingFinished = false;

  constructor(address[] _minters)
    MinterRole(_minters)
    public
  {
  }

  modifier canMint() {
    require(!mintingFinished);
    _;
  }

  /**
   * @dev Function to mint tokens
   * @param _to The address that will receive the minted tokens.
   * @param _tokenId The token id to mint.
   * @return A boolean that indicates if the operation was successful.
   */
  function mint(
    address _to,
    uint256 _tokenId
  )
    public
    onlyMinter
    canMint
    returns (bool)
  {
    _mint(_to, _tokenId);
    emit Minted(_to, _tokenId);
    return true;
  }

  function mintWithTokenURI(
    address _to,
    uint256 _tokenId,
    string _tokenURI
  )
    public
    onlyMinter
    canMint
    returns (bool)
  {
    mint(_to, _tokenId);
    _setTokenURI(_tokenId, _tokenURI);
    return true;
  }

  /**
   * @dev Function to stop minting new tokens.
   * @return True if the operation was successful.
   */
  function finishMinting()
    public
    onlyMinter
    canMint
    returns (bool)
  {
    mintingFinished = true;
    emit MintingFinished();
    return true;
  }
}
