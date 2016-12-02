pragma solidity ^0.4.4;


import './Shareable.sol';


/*
 * DayLimit
 *
 * inheritable "property" contract that enables methods to be protected by placing a linear limit (specifiable)
 * on a particular resource per calendar day. is multiowned to allow the limit to be altered. resource that method
 * uses is specified in the modifier.
 */
contract DayLimit is Shareable {
  // FIELDS

  uint public dailyLimit;
  uint public spentToday;
  uint public lastDay;


  // MODIFIERS

  // simple modifier for daily limit.
  modifier limitedDaily(uint _value) {
    if (underLimit(_value))
      _;
  }


  // CONSTRUCTOR
  // stores initial daily limit and records the present day's index.
  function DayLimit(uint _limit) {
    dailyLimit = _limit;
    lastDay = today();
  }


  // METHODS

  // (re)sets the daily limit. needs many of the owners to confirm. doesn't alter the amount already spent today.
  function setDailyLimit(uint _newLimit) onlymanyowners(sha3(msg.data)) external {
    dailyLimit = _newLimit;
  }

  // resets the amount already spent today. needs many of the owners to confirm
  function resetSpentToday() onlymanyowners(sha3(msg.data)) external {
    spentToday = 0;
  }


  // INTERNAL METHODS

  // checks to see if there is at least `_value` left from the daily limit today. if there is, subtracts it and
  // returns true. otherwise just returns false.
  function underLimit(uint _value) internal onlyOwner returns (bool) {
    // reset the spend limit if we're on a different day to last time.
    if (today() > lastDay) {
      spentToday = 0;
      lastDay = today();
    }
    // check to see if there's enough left - if so, subtract and return true.
    // overflow protection                    // dailyLimit check  
    if (spentToday + _value >= spentToday && spentToday + _value <= dailyLimit) {
      spentToday += _value;
      return true;
    }
    return false;
  }

  // determines today's index.
  function today() private constant returns (uint) {
    return now / 1 days;
  }
}
