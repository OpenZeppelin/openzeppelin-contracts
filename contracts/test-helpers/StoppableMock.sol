pragma solidity ^0.4.0;
import '../Stoppable.sol';

// mock class using Stoppable
contract StoppableMock is Stoppable(msg.sender) {
  bool public drasticMeasureTaken;
  uint public count;

  function StoppableMock() Stoppable(msg.sender){
    drasticMeasureTaken = false;
    count = 0;
  }

  function normalProcess() external stopInEmergency {
    count++;
  }

  function drasticMeasure() external onlyInEmergency {
    drasticMeasureTaken = true;
  }

}
