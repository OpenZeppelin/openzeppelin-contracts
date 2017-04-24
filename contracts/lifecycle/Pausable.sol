pragma solidity ^0.4.8;


import "../ownership/Ownable.sol";


/*
 * Pausable
 * Abstract contract that allows children to implement a
 * pause mechanism.
 */
contract Pausable is Ownable {
  event Pause();
  event Unpause();

  bool public paused = false;

  modifier whenNotPaused() {
    if (paused) throw;
    _;
  }

  modifier whenPaused {
    if (!paused) throw;
    _;
  }

  // called by the owner to pause, triggers stopped state
  function pause() onlyOwner whenNotPaused returns (bool) {
    paused = true;
    Pause();
    return true;
  }

  // called by the owner to unpause, returns to normal state
  function unpause() onlyOwner whenPaused returns (bool) {
    paused = false;
    Unpause();
    return true;
  }
}
