pragma solidity ^0.4.8;


import "../ownership/Ownable.sol";


/*
 * Pausable
 * Abstract contract that allows children to implement an
 * emergency stop mechanism.
 */
contract Pausable is Ownable {
  bool public stopped;

  modifier stopInEmergency {
    if (!stopped) {
      _;
    }
  }
  
  modifier onlyInEmergency {
    if (stopped) {
      _;
    }
  }

  // called by the owner on emergency, triggers stopped state
  function emergencyStop() external onlyOwner {
    stopped = true;
  }

  // called by the owner on end of emergency, returns to normal state
  function release() external onlyOwner onlyInEmergency {
    stopped = false;
  }

}
