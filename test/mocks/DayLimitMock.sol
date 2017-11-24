pragma solidity ^0.4.18;
import "../../contracts/DayLimit.sol";

contract DayLimitMock is DayLimit {
  uint256 public totalSpending;

  function DayLimitMock(uint256 _value) public DayLimit(_value) {
    totalSpending = 0;
  }

  function attemptSpend(uint256 _value) external limitedDaily(_value) {
    totalSpending += _value;
  }

  function setDailyLimit(uint256 _newLimit) external {
    _setDailyLimit(_newLimit);
  }

  function resetSpentToday() external {
    _resetSpentToday();
  }

}
