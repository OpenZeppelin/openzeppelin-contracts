pragma solidity ^0.4.24;

import "./StandardToken.sol";
import "../../access/rbac/Roles.sol";

contract MinterRole {
  using Roles for Roles.Role;

  Roles.Role private minters;

  constructor(address[] _minters) {
    minters.addMany(_minters);
  }

  function isMinter(address _account) public view returns (bool) {
    return minters.has(msg.sender);
  }

  modifier onlyMinter() {
    require(isMinter(msg.sender));
    _;
  }

  function transferMinterRole(address _account) public {
    minters.transfer(_account);
  }
}

/**
 * @title Mintable token
 * @dev Simple ERC20 Token example, with mintable token creation
 * Based on code by TokenMarketNet: https://github.com/TokenMarketNet/ico/blob/master/contracts/MintableToken.sol
 */
contract MintableToken is StandardToken, MinterRole {
  event Mint(address indexed to, uint256 amount);
  event MintFinished();

  bool public mintingFinished = false;

  constructor(address[] _minters) MinterRole(_minters) {
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
    emit Mint(_to, _amount);
    return true;
  }

  /**
   * @dev Function to stop minting new tokens.
   * @return True if the operation was successful.
   */
  function finishMinting() public onlyMinter canMint returns (bool) {
    mintingFinished = true;
    emit MintFinished();
    return true;
  }
}
