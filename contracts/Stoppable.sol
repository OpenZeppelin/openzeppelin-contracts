pragma solidity ^0.4.0;
/*
 * Stoppable
 * Abstract contract that allows children to implement an
 * emergency stop mechanism.
 */
contract Stoppable {
  address public curator;
  bool public stopped;

  modifier stopInEmergency { if (!stopped) _; }
  modifier onlyInEmergency { if (stopped) _; }

  function Stoppable(address _curator) {
    if (_curator == 0) throw;
    curator = _curator;
  }

  function emergencyStop() external {
    if (msg.sender != curator) throw;
    stopped = true;
  }

  function release() external onlyInEmergency {
    if (msg.sender != curator) throw;
    stopped = false;
  }

}
