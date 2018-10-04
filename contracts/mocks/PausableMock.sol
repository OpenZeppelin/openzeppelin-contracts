pragma solidity ^0.4.24;


import "../Initializable.sol";
import "../lifecycle/Pausable.sol";
import "./PauserRoleMock.sol";


// mock class using Pausable
contract PausableMock is Initializable, Pausable, PauserRoleMock {
  bool public drasticMeasureTaken;
  uint256 public count;

  constructor() public {
    Pausable.initialize();

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
