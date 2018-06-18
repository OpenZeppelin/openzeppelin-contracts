pragma solidity ^0.4.0;

import "./IntervalAction.sol";

contract BlockNumberIntervalAction is IntervalAction {
  function BlockNumberIntervalAction(uint iSize) IntervalAction(iSize) {
  }

  function getTime() private returns (uint timeStamp) {
    return block.number;
  }
}
