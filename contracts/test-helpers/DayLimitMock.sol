pragma solidity ^0.4.4;
import "../DayLimit.sol";

contract DayLimitMock is DayLimit {
  uint public totalSpending;

  function DayLimitMock(uint _value, address[] _owners, uint _required) DayLimit(_value) Shareable(_owners, _required) {
    totalSpending = 0;
  }

  function attemptSpend(uint _value) external limitedDaily(_value) {
    totalSpending += _value;
  }

}
