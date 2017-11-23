pragma solidity ^0.4.11;


import './Ownable.sol';


/**
 * @title Inheritable
 * @dev The Inheritable contract provides ownership transfer capabilities, in the
 * case that the current owner stops "heartbeating". Only the heir can pronounce the
 * owner's death.
 */
contract Inheritable2 is Ownable {
  address public heir;

  // Time window the owner has to notify she is alive.
  uint public heartbeatTimeout;

  // Timestamp of the owner's death, as pronounced by the heir.
  uint public timeOfDeath;


  event OwnerPronouncedDead(address indexed owner, address indexed heir, uint indexed timeOfDeath);


  /**
   * @dev Throw an exception if called by any account other than the heir's.
   */
  modifier onlyHeir() {
    require(msg.sender == heir);
    _;
  }


  /**
   * @notice Create a new Inheritable Contract with heir address 0x0.
   * @param _heartbeatTimeout time available for the owner to notify she's alive,
   * before the heir can take ownership.
   */
  function Inheritable(uint _heartbeatTimeout) public {
    heartbeatTimeout = _heartbeatTimeout;
  }

  function setHeir(address newHeir) public onlyOwner {
    heir = newHeir;
  }

  /**
   * @dev set heir = 0x0
   */
  function removeHeir() public onlyOwner {
    delete(heir);
  }

  function setHeartbeatTimeout(uint newHeartbeatTimeout) public onlyOwner {
    require(ownerLives());
    heartbeatTimeout = newHeartbeatTimeout;
  }

  /**
   * @dev Heir can pronounce the owners death. To inherit the ownership, he will
   * have to wait for `heartbeatTimeout` seconds.
   */
  function pronounceDeath() public onlyHeir {
    require(ownerLives());
    timeOfDeath = now;
    OwnerPronouncedDead(owner, heir, timeOfDeath);
  }

  /**
   * @dev Owner can send a heartbeat if she was mistakenly pronounced dead.
   */
  function heartbeat() public onlyOwner {
    delete(timeOfDeath);
  }

  /**
   * @dev Allows heir to transfer ownership only if heartbeat has timed out.
   */
  function inherit() public onlyHeir {
    require(!ownerLives());
    require(now >= timeOfDeath + heartbeatTimeout);
    OwnershipTransferred(owner, heir);
    owner = heir;
    delete(timeOfDeath);
  }

  function ownerLives() internal returns (bool) {
    return timeOfDeath == 0;
  }
}