pragma solidity ^0.4.24;


import "../lifecycle/DecentralizedPausable.sol";


// mock class using Pausable
contract DecentralizedPausableMock is DecentralizedPausable {
  bool public drasticMeasureTaken;
  uint256 public count;

  constructor() public {
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
