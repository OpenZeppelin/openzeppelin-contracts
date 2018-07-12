pragma solidity ^0.4.21;

import "../token/ERC20/StandardToken.sol";
import "../token/ERC20/MigratableERC20.sol";

/**
 * @title MigratedERC20Mock
 * @dev This contract is a mock to test how a token could be migrated using the MigratableERC20 contract
 */
contract MigratedERC20Mock is MigratableERC20, StandardToken {

  /**
   * @dev Internal minting function
   * This function will be removed in favour of our new upcoming version of StandardToken
   */
  function _mint(address _to, uint256 _amount) internal {
    require(_to != address(0));
    totalSupply_ = totalSupply_.add(_amount);
    balances[_to] = balances[_to].add(_amount);
    emit Transfer(address(0), _to, _amount);
  }
}
