pragma solidity ^0.4.24;

import "../access/rbac/PauserRole.sol";


/**
 * @title Pausable
 * @dev Base contract which allows children to implement an emergency stop mechanism.
 */
contract Pausable is PauserRole {
  event Paused();
  event Unpaused();

  bool public paused = false;


  /**
   * @dev Modifier to make a function callable only when the contract is not paused.
   */
  modifier whenNotPaused() {
    require(!paused);
    _;
  }

  /**
   * @dev Modifier to make a function callable only when the contract is paused.
   */
  modifier whenPaused() {
    require(paused);
    _;
  }

  /**
   * @dev called by the owner to pause, triggers stopped state
   */
  function pause() public onlyPauser whenNotPaused {
    paused = true;
    emit Paused();
  }

  /**
   * @dev called by the owner to unpause, returns to normal state
   */
  function unpause() public onlyPauser whenPaused {
    paused = false;
    emit Unpaused();
  }
}
