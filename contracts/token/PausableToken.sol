pragma solidity ^0.4.11;

import './StandardToken.sol';
import '../lifecycle/Pausable.sol';

/**
 * Pausable token
 *
 * Simple ERC20 Token example, with pausable token creation
 * Issue:
 * https://github.com/OpenZeppelin/zeppelin-solidity/issues/194
 * Based on code by BCAPtoken:
 * https://github.com/BCAPtoken/BCAPToken/blob/5cb5e76338cc47343ba9268663a915337c8b268e/sol/BCAPToken.sol#L27
 **/

contract PausableToken is Pausable, StandardToken {

  function transfer(address _to, uint _value) whenNotPaused {
    super.transfer(_to, _value);
  }

  function transferFrom(address _from, address _to, uint _value) whenNotPaused {
    super.transferFrom(_from, _to, _value);
  }
}
