pragma solidity ^0.5.0;

import "../lifecycle/Revokable.sol";
import "./RevokerRoleMock.sol";

// mock class using Revokable
contract RevokableMock is Revokable, RevokerRoleMock {
    bool public drasticMeasureTaken;
    uint256 public count;

    constructor () public {
        drasticMeasureTaken = false;
        count = 0;
    }

    function normalProcess() external whenNotRevoked {
        count++;
    }

    function drasticMeasure() external whenPaused {
        drasticMeasureTaken = true;
    }
}
