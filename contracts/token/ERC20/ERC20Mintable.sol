pragma solidity ^0.4.24;

import "./ERC20.sol";
import "../../ownership/Ownable.sol";


/**
 * @title Mintable token
 * @dev Simple ERC20 Token example, with mintable token creation
 * Based on code by TokenMarketNet: https://github.com/TokenMarketNet/ico/blob/master/contracts/MintableToken.sol
 */
contract ERC20Mintable is ERC20, Ownable {
  event Mint(address indexed to, uint256 amount);
  event MintFinished();

  bool private _mintingFinished = false;


  modifier onlyBeforeMintingFinished() {
    require(!_mintingFinished);
    _;
  }

  modifier onlyMinter() {
    require(isOwner());
    _;
  }

  /**
   * @return true if the minting is finished.
   */
  function mintingFinished() public view returns(bool) {
    return _mintingFinished;
  }

  /**
   * @dev Function to mint tokens
   * @param to The address that will receive the minted tokens.
   * @param amount The amount of tokens to mint.
   * @return A boolean that indicates if the operation was successful.
   */
  function mint(
    address to,
    uint256 amount
  )
    public
    onlyMinter
    onlyBeforeMintingFinished
    returns (bool)
  {
    _mint(to, amount);
    emit Mint(to, amount);
    return true;
  }

  /**
   * @dev Function to stop minting new tokens.
   * @return True if the operation was successful.
   */
  function finishMinting()
    public
    onlyOwner
    onlyBeforeMintingFinished
    returns (bool)
  {
    _mintingFinished = true;
    emit MintFinished();
    return true;
  }
}
