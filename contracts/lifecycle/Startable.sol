pragma solidity ^0.4.8;

import "./PauseInfrastructure.sol";

/*
 * Startable
 * Abstract contract that allows children to implement a
 * startable mechanism.
 */
contract Startable is PauseInfrastructure {
  function Startable () PauseInfrastructure(true){
  }

  // called by the owner to start
  function start() onlyOwner whenPaused returns (bool) {
    paused = false;
    triggerUnpauseEvent();
    return true;
  }
}