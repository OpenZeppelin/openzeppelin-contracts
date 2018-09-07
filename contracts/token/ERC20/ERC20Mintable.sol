pragma solidity ^0.4.24;

import "./ERC20.sol";
import "../../access/roles/MinterRole.sol";


/**
 * @title ERC20Mintable
 * @dev ERC20 minting logic
 */
contract ERC20Mintable is ERC20, MinterRole {
  event Minted(address indexed to, uint256 amount);
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
    emit Minted(_to, _amount);
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
