pragma solidity ^0.4.18;

import "../token/ERC20/InflationaryToken.sol";


contract InflationaryTokenMock is InflationaryToken {
  function InflationaryTokenMock(
    uint256 hoursElapsed,
    uint256 _totalSupply,
    uint256 _inflationRatePerInterval) public
  {
    inflationRatePerInterval = _inflationRatePerInterval;
    timeInterval = 1 hours;
    lastInflationCalc = now - hoursElapsed * 1 hours;
    totalSupply_ = _totalSupply;
    balances[msg.sender] = totalSupply_;
  }
}
