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

  bool private mintingFinished_ = false;


  modifier onlyBeforeMintingFinished() {
    require(!mintingFinished_);
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
    return mintingFinished_;
  }

  /**
   * @dev Function to mint tokens
   * @param _to The address that will receive the minted tokens.
   * @param _amount The amount of tokens to mint.
   * @return A boolean that indicates if the operation was successful.
   */
  function mint(
    address _to,
    uint256 _amount
  )
    public
    onlyMinter
    onlyBeforeMintingFinished
    returns (bool)
  {
    _mint(_to, _amount);
    emit Mint(_to, _amount);
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
    mintingFinished_ = true;
    emit MintFinished();
    return true;
  }
}
