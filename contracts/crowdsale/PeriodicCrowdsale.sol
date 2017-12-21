pragma solidity ^0.4.18;

import '../math/SafeMath.sol';
import '../ownership/Ownable.sol';
import './Crowdsale.sol';

/**
 * @title FinalizableCrowdsale
 * @dev Extension of Crowdsale where an owner can do extra work
 * after finishing.
 */
contract PeriodicCrowdsale is Crowdsale {
  using SafeMath for uint256;

  /**
   * @dev Can be overridden to periodization logic.
   */
  function getRate() internal constant returns(uint256) {
    return rate;
  }
}
