pragma solidity ^0.4.8;

import '../../contracts/lifecycle/Startable.sol';


// mock class using Pausable
contract StartableMock is Startable {
  bool public drasticMeasureTaken;
  uint public count;

  function StartableMock() {
    drasticMeasureTaken = false;
    count = 0;
  }

  function normalProcess() external whenNotPaused {
    count++;
  }

  function drasticMeasure() external whenPaused {
    drasticMeasureTaken = true;
  }

}
