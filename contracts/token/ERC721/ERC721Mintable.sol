pragma solidity ^0.4.24;

import "./ERC721.sol";
import "../../access/roles/MinterRole.sol";


/**
 * @title ERC721Mintable
 * @dev ERC721 minting logic
 */
contract ERC721Mintable is ERC721, MinterRole {
  event Minted(address indexed to, uint256 tokenId);
  event MintingFinished();

  bool private mintingFinished_ = false;

  modifier onlyBeforeMintingFinished() {
    require(!mintingFinished_);
    _;
  }

  /**
   * @return true if the minting is finished.
   */
  function mintingFinished() public view returns(bool) {
    return mintingFinished_;
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
    onlyBeforeMintingFinished
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
    onlyBeforeMintingFinished
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
    onlyBeforeMintingFinished
    returns (bool)
  {
    mintingFinished_ = true;
    emit MintingFinished();
    return true;
  }
}
