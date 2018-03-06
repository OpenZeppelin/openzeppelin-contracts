pragma solidity ^0.4.18;

import "./BasicToken.sol";
import "../../ownership/Ownable.sol";


/**
 * @title Burnable Token
 * @dev Token that can be irreversibly burned (destroyed).
 */
contract BurnableToken is BasicToken, Ownable {

  event Burn(address indexed from, uint256 amount);

  /**
   * @dev Function to burn tokens
   * @param _from The address that tokens will be burned from.
   * @param _amount The amount of tokens to burn.
   * @return A boolean that indicates if the operation was successful.
   */
  function burn(address _from, uint256 _amount) onlyOwner public returns (bool) {
    require(_amount <= balances[_from]);
    // no need to require value <= totalSupply, since that would imply the
    // sender's balance is greater than the totalSupply, which *should* be an assertion failure

    balances[_from] = balances[_from].sub(_amount);
    totalSupply_ = totalSupply_.sub(_amount);
    Burn(_from, _amount);
    Transfer(_from, address(0), _amount);
    return true;
  }
}
