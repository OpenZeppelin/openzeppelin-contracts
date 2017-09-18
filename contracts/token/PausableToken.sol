pragma solidity ^0.4.11;

import './StandardToken.sol';
import '../lifecycle/Pausable.sol';

/**
 * @title Pausable token
 *
 * @dev StandardToken modified with pausable transfers.
 **/

contract PausableToken is StandardToken, Pausable {

  function transfer(address _to, uint256 _value) whenNotPaused public returns (bool) {
    return super.transfer(_to, _value);
  }

  function transferFrom(address _from, address _to, uint256 _value) whenNotPaused public returns (bool) {
    return super.transferFrom(_from, _to, _value);
  }
}
