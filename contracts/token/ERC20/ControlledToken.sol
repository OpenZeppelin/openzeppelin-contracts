pragma solidity ^0.4.18;

import "./BasicToken.sol";
import "../../math/SafeMath.sol";
import "../../ownership/Ownable.sol";


/**
 * @title Controlled Token
 * @dev Token that can be irreversibly burned (destroyed) and minted (created) at will by the contract owner.
 */
contract ControlledToken is BasicToken, Ownable {
  using SafeMath for uint256;

  event Burn(address indexed from, uint256 amount);
  event Mint(address indexed to, uint256 amount);

  /**
   * @dev Function to burn tokens
   * @param _from The address that tokens will be burned from.
   * @param _amount The amount of tokens to burn.
   * @return A boolean that indicates if the operation was successful.
   */
  function burn(address _from, uint256 _amount) onlyOwner public returns (bool) {
    require(_amount <= super.balanceOf(_from));

    totalSupply_ = totalSupply_.sub(_amount);
    balances[_from] = balances[_from].sub(_amount);

    Burn(_from, _amount);
    Transfer(_from, address(0), _amount);

    return true;
  }

  /**
   * @dev Function to mint tokens
   * @param _to The address that will receive the minted tokens.
   * @param _amount The amount of tokens to mint.
   * @return A boolean that indicates if the operation was successful.
   */
  function mint(address _to, uint256 _amount) onlyOwner public returns (bool) {
    totalSupply_ = totalSupply_.add(_amount);
    balances[_to] = balances[_to].add(_amount);

    Mint(_to, _amount);
    Transfer(address(0), _to, _amount);

    return true;
  }
}
