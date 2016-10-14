pragma solidity ^0.4.0;

import "./IntervalAction.sol";

contract TimeIntervalAction is IntervalAction {
  function TimeIntervalAction(uint iSize) IntervalAction(iSize) {
  }
  function getTime() private returns (uint timeStamp) {
    return now;
  }
}
