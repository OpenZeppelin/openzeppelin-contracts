pragma solidity ^0.4.24;


import "./Pausable.sol";


/**
 * @title DecentralizedPausable
 * @dev Base contract which allows children to implement an emergency stop mechanism.
 * Only the owner can control pause, that is centralized. so, user must be able to unpause himself for decentralized.
 */
contract DecentralizedPausable is Pausable {
  event UserUnpause(address indexed _user);

  uint public pauseStartBlock;
  mapping(uint => mapping(address => bool)) public unpausedUsers;


  /**
   * @dev Modifier to make a function callable only when the contract is not paused.
   */
  modifier whenNotPaused() {
    if (paused) {
      require(unpausedUsers[pauseStartBlock][msg.sender]);
    }
    _;
  }

  /**
   * @dev Modifier to make a function callable only when the contract is paused.
   */
  modifier whenPaused() {
    if (paused) {
      require(!unpausedUsers[pauseStartBlock][msg.sender]);
    } else {
      revert();
    }
    _;
  }

  /**
   * @dev called by the owner to pause, triggers stopped state and record that block.number.
   */
  function pause() onlyOwner whenNotPaused public {
    paused = true;
    pauseStartBlock = block.number;
    emit Pause();
  }

  /**
   * @dev called by a user to unpause only himself. it's for decentralized controllable.
   */
  function unpauseOnlySelf() whenPaused public {
    require(owner != msg.sender); // owner can not calle this.
    unpausedUsers[pauseStartBlock][msg.sender] = true;
    emit UserUnpause(msg.sender);
  }
}
