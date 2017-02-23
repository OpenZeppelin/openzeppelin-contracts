pragma solidity ^0.4.8;


import './ownership/Shareable.sol';


/*
 * DayLimit
 *
 * inheritable "property" contract that enables methods to be protected by placing a linear limit (specifiable)
 * on a particular resource per calendar day. is multiowned to allow the limit to be altered. resource that method
 * uses is specified in the modifier.
 */
contract DayLimit {

  uint public dailyLimit;
  uint public spentToday;
  uint public lastDay;


  function DayLimit(uint _limit) {
    dailyLimit = _limit;
    lastDay = today();
  }

  // sets the daily limit. doesn't alter the amount already spent today
  function _setDailyLimit(uint _newLimit) internal {
    dailyLimit = _newLimit;
  }

  // resets the amount already spent today.
  function _resetSpentToday() internal {
    spentToday = 0;
  }

  // checks to see if there is at least `_value` left from the daily limit today. if there is, subtracts it and
  // returns true. otherwise just returns false.
  function underLimit(uint _value) internal returns (bool) {
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


  // simple modifier for daily limit.
  modifier limitedDaily(uint _value) {
    if (!underLimit(_value)) {
      throw;
    }
    _;
  }
}
