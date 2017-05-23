pragma solidity ^0.4.8;
import "../../contracts/DayLimit.sol";

contract DayLimitMock is DayLimit {
  uint public totalSpending;

  function DayLimitMock(uint _value) DayLimit(_value) {
    totalSpending = 0;
  }

  function attemptSpend(uint _value) external limitedDaily(_value) {
    totalSpending += _value;
  }

  function setDailyLimit(uint _newLimit) external {
    _setDailyLimit(_newLimit);
  }

  function resetSpentToday() external {
    _resetSpentToday();
  }

}
