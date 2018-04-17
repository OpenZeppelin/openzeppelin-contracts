pragma solidity ^0.4.21;


/**
 * @title DayLimit
 * @dev Base contract that enables methods to be protected by placing a linear limit (specifiable)
 * on a particular resource per calendar day. Is multiowned to allow the limit to be altered.
 */
contract DayLimit {

  uint256 public dailyLimit;
  uint256 public spentToday;
  uint256 public lastDay;

  /**
   * @dev Constructor that sets the passed value as a dailyLimit.
   * @param _limit uint256 to represent the daily limit.
   */
  function DayLimit(uint256 _limit) public {
    dailyLimit = _limit;
    lastDay = today();
  }

  /**
   * @dev sets the daily limit. Does not alter the amount already spent today.
   * @param _newLimit uint256 to represent the new limit.
   */
  function _setDailyLimit(uint256 _newLimit) internal {
    dailyLimit = _newLimit;
  }

  /**
   * @dev Resets the amount already spent today.
   */
  function _resetSpentToday() internal {
    spentToday = 0;
  }

  /**
   * @dev Checks to see if there is enough resource to spend today. If true, the resource may be expended.
   * @param _value uint256 representing the amount of resource to spend.
   * @return A boolean that is True if the resource was spent and false otherwise.
   */
  function underLimit(uint256 _value) internal returns (bool) {
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

  /**
   * @dev Private function to determine today's index
   * @return uint256 of today's index.
   */
  function today() private view returns (uint256) {
    // solium-disable-next-line security/no-block-members
    return block.timestamp / 1 days;
  }

  /**
   * @dev Simple modifier for daily limit.
   */
  modifier limitedDaily(uint256 _value) {
    require(underLimit(_value));
    _;
  }
}
