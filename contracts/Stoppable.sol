pragma solidity ^0.4.4;

import "./Ownable.sol";
/*
 * Stoppable
 * Abstract contract that allows children to implement an
 * emergency stop mechanism.
 */
contract Stoppable is Ownable {
  bool public stopped;

  modifier stopInEmergency { if (!stopped) _; }
  modifier onlyInEmergency { if (stopped) _; }

  function emergencyStop() external onlyOwner {
    stopped = true;
  }

  function release() external onlyOwner onlyInEmergency {
    stopped = false;
  }

}
