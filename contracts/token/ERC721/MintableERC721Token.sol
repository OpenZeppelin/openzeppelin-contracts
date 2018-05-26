pragma solidity ^0.4.23;

import "./ERC721Token.sol";
import "../../ownership/Ownable.sol";


/**
 * @title MintableERC721Token
 * @author Vittorio Minacori (@vittominacori)
 * @dev Simple ERC721 Token, with mintable token creation
 */
contract MintableERC721Token is ERC721Token, Ownable {
  event MintFinished();

  bool public mintingFinished = false;

  modifier canMint() {
    require(!mintingFinished);
    _;
  }

  modifier hasMintPermission() {
    require(msg.sender == owner);
    _;
  }

  constructor(string _name, string _symbol) public
  ERC721Token(_name, _symbol)
  { }

  /**
   * @dev Function to mint token
   * @param _to The address that will receive the minted tokens.
   * @param _tokenId The token id to mint.
   * @return A boolean that indicates if the operation was successful.
   */
  function mint(
    address _to,
    uint256 _tokenId
  )
  hasMintPermission
  canMint
  public
  returns (bool)
  {
    super._mint(_to, _tokenId);
    return true;
  }

  /**
   * @dev Function to stop minting new tokens.
   * @return True if the operation was successful.
   */
  function finishMinting() onlyOwner canMint public returns (bool) {
    mintingFinished = true;
    emit MintFinished();
    return true;
  }
}
