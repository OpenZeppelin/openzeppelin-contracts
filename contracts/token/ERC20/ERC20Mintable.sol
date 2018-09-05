pragma solidity ^0.4.24;

import "./ERC20.sol";
import "../../access/rbac/MinterRole.sol";


/**
 * @title ERC20Mintable
 * @dev ERC20 minting logic
 */
contract ERC20Mintable is ERC20, MinterRole {
  event Minted(address indexed to, uint256 amount);
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
   * @param _amount The amount of tokens to mint.
   * @return A boolean that indicates if the operation was successful.
   */
  function mint(
    address _to,
    uint256 _amount
  )
    public
    onlyMinter
    canMint
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
  function finishMinting() public onlyMinter canMint returns (bool) {
    mintingFinished = true;
    emit MintingFinished();
    return true;
  }
}
