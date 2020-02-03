pragma solidity ^0.6.0;

import "../lifecycle/Pausable.sol";
import "./PauserRoleMock.sol";

// mock class using Pausable
contract PausableMock is Pausable, PauserRoleMock {
    bool public drasticMeasureTaken;
    uint256 public count;

    constructor () public {
        drasticMeasureTaken = false;
        count = 0;
    }

    function normalProcess() external whenNotPaused {
        count++;
    }

    function drasticMeasure() external whenPaused {
        drasticMeasureTaken = true;
    }

    function pause() external {
        _pause();
    }

    function unpause() external {
        _unpause();
    }
}
