pragma solidity ^0.4.11;


import "./Ownable.sol";


/**
 * @title Heritable
 * @dev The Heritable contract provides ownership transfer capabilities, in the
 * case that the current owner stops "heartbeating". Only the heir can pronounce the
 * owner's death.
 */
contract Heritable is Ownable {
  address public heir;

  // Time window the owner has to notify they are alive.
  uint256 public heartbeatTimeout;

  // Timestamp of the owner's death, as pronounced by the heir.
  uint256 public timeOfDeath;

  event HeirChanged(address indexed owner, address indexed newHeir);
  event OwnerHeartbeated(address indexed owner);
  event OwnerProclaimedDead(address indexed owner, address indexed heir, uint256 timeOfDeath);
  event HeirOwnershipClaimed(address indexed previousOwner, address indexed newOwner);


  /**
   * @dev Throw an exception if called by any account other than the heir's.
   */
  modifier onlyHeir() {
    require(msg.sender == heir);
    _;
  }


  /**
   * @notice Create a new Heritable Contract with heir address 0x0.
   * @param _heartbeatTimeout time available for the owner to notify they are alive,
   * before the heir can take ownership.
   */
  function Heritable(uint256 _heartbeatTimeout) public {
    setHeartbeatTimeout(_heartbeatTimeout);
  }

  function setHeir(address newHeir) public onlyOwner {
    require(newHeir != owner);
    heartbeat();
    HeirChanged(owner, newHeir);
    heir = newHeir;
  }

  /**
   * @dev set heir = 0x0
   */
  function removeHeir() public onlyOwner {
    heartbeat();
    heir = 0;
  }

  /**
   * @dev Heir can pronounce the owners death. To claim the ownership, they will
   * have to wait for `heartbeatTimeout` seconds.
   */
  function proclaimDeath() public onlyHeir {
    require(ownerLives());
    OwnerProclaimedDead(owner, heir, timeOfDeath);
    timeOfDeath = now;
  }

  /**
   * @dev Owner can send a heartbeat if they were mistakenly pronounced dead.
   */
  function heartbeat() public onlyOwner {
    OwnerHeartbeated(owner);
    timeOfDeath = 0;
  }

  /**
   * @dev Allows heir to transfer ownership only if heartbeat has timed out.
   */
  function claimHeirOwnership() public onlyHeir {
    require(!ownerLives());
    require(now >= timeOfDeath + heartbeatTimeout);
    OwnershipTransferred(owner, heir);
    HeirOwnershipClaimed(owner, heir);
    owner = heir;
    timeOfDeath = 0;
  }

  function setHeartbeatTimeout(uint256 newHeartbeatTimeout) internal onlyOwner {
    require(ownerLives());
    heartbeatTimeout = newHeartbeatTimeout;
  }

  function ownerLives() internal view returns (bool) {
    return timeOfDeath == 0;
  }
}
