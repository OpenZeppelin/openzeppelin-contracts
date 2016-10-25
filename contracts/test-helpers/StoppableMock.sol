pragma solidity ^0.4.0;
import '../Stoppable.sol';

// mock class using Stoppable
contract StoppableMock is Stoppable {
  bool public drasticMeasureTaken;
  uint public count = 0;

  function normalProcess() external stopInEmergency {
    count++;
  }

  function drasticMeasure() external onlyInEmergency {
    drasticMeasureTaken = true;
  }

}
