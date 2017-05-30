pragma solidity ^0.4.8;

import './StandardToken.sol';
import '../lifecycle/Startable.sol';

/**
 * Startable.sol token
 *
 * Simple ERC20 Token example, with start mechanism
 * Issue:
 * https://github.com/OpenZeppelin/zeppelin-solidity/issues/194
 * Based on code by BCAPtoken:
 * https://github.com/BCAPtoken/BCAPToken/blob/5cb5e76338cc47343ba9268663a915337c8b268e/sol/BCAPToken.sol#L27
 **/

contract StartableToken is Startable, StandardToken {

  function transfer(address _to, uint _value) whenNotPaused {
    return super.transfer(_to, _value);
  }

  function transferFrom(address _from, address _to, uint _value) whenNotPaused {
    return super.transferFrom(_from, _to, _value);
  }
}
