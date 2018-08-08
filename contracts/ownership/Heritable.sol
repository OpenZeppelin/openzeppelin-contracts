pragma solidity ^0.4.24;


import "./Ownable.sol";


/**
 * @title Heritable
 * @dev The Heritable contract provides ownership transfer capabilities, in the
 * case that the current owner stops "heartbeating". Only the heir can pronounce the
 * owner's death.
 */
contract Heritable is Ownable {
  address private heir_;

  // Time window the owner has to notify they are alive.
  uint256 private heartbeatTimeout_;

  // Timestamp of the owner's death, as pronounced by the heir.
  uint256 private timeOfDeath_;

  event HeirChanged(address indexed owner, address indexed newHeir);
  event OwnerHeartbeated(address indexed owner);
  event OwnerProclaimedDead(
    address indexed owner,
    address indexed heir,
    uint256 timeOfDeath
  );
  event HeirOwnershipClaimed(
    address indexed previousOwner,
    address indexed newOwner
  );


  /**
   * @dev Throw an exception if called by any account other than the heir's.
   */
  modifier onlyHeir() {
    require(msg.sender == heir_);
    _;
  }


  /**
   * @notice Create a new Heritable Contract with heir address 0x0.
   * @param _heartbeatTimeout time available for the owner to notify they are alive,
   * before the heir can take ownership.
   */
  constructor(uint256 _heartbeatTimeout) public {
    setHeartbeatTimeout(_heartbeatTimeout);
  }

  function setHeir(address _newHeir) public onlyOwner {
    require(_newHeir != owner);
    heartbeat();
    emit HeirChanged(owner, _newHeir);
    heir_ = _newHeir;
  }

  /**
   * @dev Use these getter functions to access the internal variables in
   * an inherited contract.
   */
  function heir() public view returns(address) {
    return heir_;
  }

  function heartbeatTimeout() public view returns(uint256) {
    return heartbeatTimeout_;
  }

  function timeOfDeath() public view returns(uint256) {
    return timeOfDeath_;
  }

  /**
   * @dev set heir = 0x0
   */
  function removeHeir() public onlyOwner {
    heartbeat();
    heir_ = address(0);
  }

  /**
   * @dev Heir can pronounce the owners death. To claim the ownership, they will
   * have to wait for `heartbeatTimeout` seconds.
   */
  function proclaimDeath() public onlyHeir {
    require(ownerLives());
    emit OwnerProclaimedDead(owner, heir_, timeOfDeath_);
    // solium-disable-next-line security/no-block-members
    timeOfDeath_ = block.timestamp;
  }

  /**
   * @dev Owner can send a heartbeat if they were mistakenly pronounced dead.
   */
  function heartbeat() public onlyOwner {
    emit OwnerHeartbeated(owner);
    timeOfDeath_ = 0;
  }

  /**
   * @dev Allows heir to transfer ownership only if heartbeat has timed out.
   */
  function claimHeirOwnership() public onlyHeir {
    require(!ownerLives());
    // solium-disable-next-line security/no-block-members
    require(block.timestamp >= timeOfDeath_ + heartbeatTimeout_);
    emit OwnershipTransferred(owner, heir_);
    emit HeirOwnershipClaimed(owner, heir_);
    owner = heir_;
    timeOfDeath_ = 0;
  }

  function setHeartbeatTimeout(uint256 _newHeartbeatTimeout)
    internal onlyOwner
  {
    require(ownerLives());
    heartbeatTimeout_ = _newHeartbeatTimeout;
  }

  function ownerLives() internal view returns (bool) {
    return timeOfDeath_ == 0;
  }
}
